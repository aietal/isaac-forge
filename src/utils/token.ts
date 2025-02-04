import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const ISAACX_TOKEN_ADDRESS = 'C19Q2Mvr1icQVxQJWpDTVDJjLTzAcXbUt3pBmBsYpump';

export class IsaacXToken {
    private connection: Connection;
    private tokenMint: PublicKey;
    private payer: Keypair;

    constructor(
        rpcUrl: string,
        privateKey: Uint8Array
    ) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.tokenMint = new PublicKey(ISAACX_TOKEN_ADDRESS);
        this.payer = Keypair.fromSecretKey(privateKey);
    }

    async getBalance(address: string): Promise<bigint> {
        try {
            const userPubkey = new PublicKey(address);
            const tokenAccount = await getAssociatedTokenAddress(this.tokenMint, userPubkey);
            const account = await getAccount(this.connection, tokenAccount);
            return BigInt(account.amount.toString());
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    async chargeTokens(from: string, amount: bigint): Promise<boolean> {
        try {
            const fromPubkey = new PublicKey(from);
            const fromTokenAccount = await getAssociatedTokenAddress(this.tokenMint, fromPubkey);
            const toTokenAccount = await getAssociatedTokenAddress(this.tokenMint, this.payer.publicKey);
            
            const transferIx = createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromPubkey,
                BigInt(amount.toString())
            );

            // Note: This is a simplified version. In production, we'd need proper
            // transaction building, signing, and confirmation handling
            const tx = await this.connection.sendTransaction(transferIx, [this.payer]);
            await this.connection.confirmTransaction(tx);
            
            return true;
        } catch (error) {
            console.error('Token charge failed:', error);
            return false;
        }
    }
}

// Compute unit conversion (1 compute unit = 0.001 ISAACX)
export const COMPUTE_UNIT_COST = BigInt(1000000);

export async function validateAndChargeCompute(
    token: IsaacXToken,
    userAddress: string,
    computeUnits: number
): Promise<boolean> {
    const requiredTokens = BigInt(computeUnits) * COMPUTE_UNIT_COST;
    
    try {
        const balance = await token.getBalance(userAddress);
        if (balance < requiredTokens) {
            throw new Error(`Insufficient $ISAACX balance. Required: ${requiredTokens}, Available: ${balance}`);
        }

        return await token.chargeTokens(userAddress, requiredTokens);
    } catch (error) {
        console.error('Compute validation failed:', error);
        throw error;
    }
} 
import { ethers } from 'ethers';

// ISAACX token contract ABI (only the functions we need)
const ISAACX_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

export class IsaacXToken {
    private contract: ethers.Contract;
    private provider: ethers.Provider;
    private signer: ethers.Signer;

    constructor(
        contractAddress: string,
        providerUrl: string,
        privateKey: string
    ) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(contractAddress, ISAACX_ABI, this.signer);
    }

    async getBalance(address: string): Promise<bigint> {
        return await this.contract.balanceOf(address);
    }

    async chargeTokens(from: string, amount: bigint): Promise<boolean> {
        try {
            const tx = await this.contract.transferFrom(from, await this.signer.getAddress(), amount);
            await tx.wait();
            return true;
        } catch (error) {
            console.error('Token charge failed:', error);
            return false;
        }
    }
}

// Compute unit conversion
export const COMPUTE_UNIT_COST = BigInt(1000000); // 1 compute unit = 0.001 ISAACX

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
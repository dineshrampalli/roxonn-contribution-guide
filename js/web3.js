const CONTRACT_ADDRESS = '0x2b0f01390349128e9aB9d90348d93Ecec46E6079';
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "name": "taskId",
                "type": "uint256"
            }
        ],
        "name": "registerContribution",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

class Web3Service {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
    }

    async init() {
        try {
            // Check if XDCPay is installed
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Please install XDCPay wallet');
            }

            // Initialize Web3
            this.web3 = new Web3(window.ethereum);

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];

            // Get network and ensure we're on XDC Testnet
            const chainId = await this.web3.eth.getChainId();
            if (chainId !== 51) {
                await this.switchToXDCTestnet();
            }

            // Initialize contribution contract
            this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            // Update wallet button
            const walletBtn = document.getElementById('wallet-button');
            walletBtn.textContent = this.account.substring(0, 6) + '...' + this.account.substring(38);
            walletBtn.classList.add('connected');

            // Setup event listeners
            window.ethereum.on('accountsChanged', (accounts) => {
                this.account = accounts[0];
                walletBtn.textContent = this.account.substring(0, 6) + '...' + this.account.substring(38);
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            return true;
        } catch (error) {
            console.error('Error initializing Web3:', error);
            showToast(error.message || 'Failed to initialize Web3');
            return false;
        }
    }

    async switchToXDCTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x33' }] // Chain ID 51 in hex
            });
        } catch (error) {
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x33',
                        chainName: 'XDC Apothem Testnet',
                        nativeCurrency: {
                            name: 'XDC',
                            symbol: 'XDC',
                            decimals: 18
                        },
                        rpcUrls: ['https://rpc.apothem.network'],
                        blockExplorerUrls: ['https://explorer.apothem.network']
                    }]
                });
            } else {
                throw error;
            }
        }
    }

    async registerContribution(taskId) {
        try {
            if (!this.account) {
                throw new Error('Please connect your wallet first');
            }

            // Register the contribution
            const tx = await this.contract.methods.registerContribution(taskId)
                .send({ 
                    from: this.account,
                    gas: 200000
                });

            showToast('Contribution registered successfully!');
            return tx.transactionHash;
        } catch (error) {
            console.error('Error registering contribution:', error);
            showToast(error.message || 'Failed to register contribution');
            throw error;
        }
    }
}

const web3Service = new Web3Service();

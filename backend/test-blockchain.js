import Web3 from 'web3';

async function testConnection() {
  try {
    const web3 = new Web3('http://127.0.0.1:8545');
    const accounts = await web3.eth.getAccounts();
    const blockNumber = await web3.eth.getBlockNumber();
    
    console.log('✅ Blockchain connection successful!');
    console.log('Block number:', blockNumber);
    console.log('Available accounts:', accounts.length);
    console.log('First account:', accounts[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection failed:', error.message);
    return false;
  }
}

testConnection();

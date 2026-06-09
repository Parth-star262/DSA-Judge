const net = require('net');

const client = new net.Socket();
client.connect(5433, '192.168.250.175', function() {
	console.log('Connected to 5433 (192.168.250.175)');
	client.destroy();
});

client.on('error', function(err) {
	console.log('Error details:', err);
});

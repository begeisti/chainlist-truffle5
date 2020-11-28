module.exports = {
     // See <http://truffleframework.com/docs/advanced/configuration>
     // to customize your Truffle configuration!
     networks: {
          docker_ganache: {
               host: "127.0.0.1",
               port: 8545,
               network_id: "*" // Match any network id 
          },
          ganache: {
               host: "localhost",
               port: 7545,
               network_id: "*" // Match any network id
          },
          chainskills: {
               host: "localhost",
               port: 8545,
               network_id: "4224"
          },
          rinkeby: {
               host: "locahost",
               port: 8545,
               network_id: 4,
               gas: 4700000
          }
     },
     compilers: {
          solc: {
               settings: {
                    optimizer: {
                         enabled: true,
                         runs: 200
                    }
               }
          }
     }
};

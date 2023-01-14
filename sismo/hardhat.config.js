require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.8.14",
        settings: {},
      },
      {
        version: "0.8.4",
        settings: {},
      }
    ],
  }

};

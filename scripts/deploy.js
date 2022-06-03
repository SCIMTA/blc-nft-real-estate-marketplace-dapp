const { ethers } = require("hardhat");
const fs = require("fs");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const Estate = await ethers.getContractFactory("Estate");
  const WrapETH = await ethers.getContractFactory("WrapETH");

  const estate = await Estate.deploy();
  const wrapETH = await WrapETH.deploy();

  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(wrapETH.address, estate.address);
  fs.writeFileSync(
    "./config.json",
    JSON.stringify({
      Estate: {
        address: estate.address,
        abi: require("../build/contracts/Estate.json").abi,
        contractName: require("../build/contracts/Estate.json").contractName,
      },
      WrapETH: {
        address: wrapETH.address,
        abi: require("../build/contracts/WrapETH.json").abi,
        contractName: require("../build/contracts/WrapETH.json").contractName,
      },
      Market: {
        address: market.address,
        abi: require("../build/contracts/Market.json").abi,
        contractName: require("../build/contracts/Market.json").contractName,
      },
    })
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const Estate = artifacts.require("Estate");

module.exports = function (deployer) {
    deployer.deploy(Estate);
};

/* global BigInt */
import web3 from "web3";
import React, { Component } from "react";
import "./Styles.css";
import Estatejson from "../build/contracts/Estate.json";
import { pinJSONToIPFS } from "./MintFunc";
import ModalMintNFT from "./ModalMintNFT";
import ModalTransferNFT from "./ModalTransferNFT";
import ModalSellNFT from "./ModalSellNFT";
import NFTItem from "./NFTItem";

class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connect: false,
      chainaccount: "",
      chaincontract: null,
      userid: "",
      ipfskey: "622e46a319ab34ff19eb",
      ipfssecret:
        "b30bb9ff92870d5e462d0e6b1d5b9be4cc3ebde0a2ad659c956bf64337796b9e",
      homes: [],
      not_my_homes: [],
      loading: true,
      isShowMintNFT: false,
      isShowTransferNFT: false,
      isShowSellNFT: false,
      transferNftData: null,
      sellNftData: null,
      balance: 0,
    };
  }
  async componentWillMount() {
    await this.connectWeb3();
    if (this.state.connected === true) {
      await this.connectBlockChain();
      await this.getListNft();
    }

    window.ethereum.on("accountsChanged", async (accounts) => {
      await this.connectBlockChain();
      await this.getListNft();
    });
  }
  async connectWeb3() {
    if (window.ethereum) {
      window.web3 = new web3(window.ethereum);
      await window.ethereum.enable();
      this.setState({ connected: true });
      console.log("connected:", this.state.connected);
    } else {
      window.alert("Please Install MetaMask as a Chrome Extension");
    }
  }

  setLoadingStart = () => {
    if (!this.state.loading)
      this.setState({
        loading: true,
      });
  };

  setLoadingEnd = () => {
    if (this.state.loading)
      this.setState({
        loading: false,
      });
  };

  AccountKeeper() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", function (accounts) {
        console.log("account upon keeper:", accounts[0]);
      });
    }
  }
  async connectBlockChain() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ chainaccount: accounts[0] });
    console.log("account:", this.state.chainaccount);
    const ethNetwork_userid = await window.web3.eth.net.getId();
    this.setState({ userid: ethNetwork_userid });
    console.log("Network Id :", ethNetwork_userid);
    if (Estatejson.networks[ethNetwork_userid]) {
      const abstract_binary_interface = Estatejson.abi;
      const ethNetwork_address = Estatejson.networks[ethNetwork_userid].address;
      const contract = new web3.eth.Contract(
        abstract_binary_interface,
        ethNetwork_address
      );
      this.setState({ chaincontract: contract });
      const balance = await web3.eth.getBalance(accounts[0]);
      this.setState({
        balance: parseFloat(balance) / 10 ** 18,
      });
    }
  }

  reqtokenuri = async (address, description, image) => {
    const metadata = new Object();
    metadata.address = address;
    metadata.description = description;
    metadata.image = image;

    const pinataResponse = await pinJSONToIPFS(metadata);
    if (!pinataResponse.success) {
      return {
        success: false,
        status: "Something went wrong while uploading your tokenURI.",
      };
    }
    const tokenURI = pinataResponse.pinataUrl;
    return tokenURI;
  };

  pinJSONToIPFS = async (JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const axios = require("axios");
    //making axios POST request to Pinata
    return axios
      .post(url, JSONBody, {
        headers: {
          pinata_api_key: this.state.ipfskey,
          pinata_secret_api_key: this.state.ipfssecret,
        },
      })
      .then(function (response) {
        return {
          success: true,
          pinataUrl:
            "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
        };
      })
      .catch(function (error) {
        console.log(error);
        return {
          success: false,
          message: error.message,
        };
      });
  };

  getListNft = async () => {
    try {
      this.setState({
        homeaddress: "",
        homedescription: "",
        image: "",
      });
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      const listMyToken = await contract.methods
        .tokensOfOwner(this.state.chainaccount)
        .call();
      const listAllToken = await contract.methods.allTokens().call();

      let listTokenDetail = [];
      let listNotMyTokenDetail = [];
      for (let i = 0; i < listAllToken.length; i++) {
        const tokenId = listAllToken[i];
        const tokenURI = await contract.methods.tokenURI(tokenId).call();
        const price = await contract.methods.priceOf(tokenId).call();
        const owner = await contract.methods.ownerOf(tokenId).call();
        const tokenData = await (await fetch(tokenURI)).json();
        const item = {
          tokenId,
          tokenURI,
          owner,
          tokenData,
          isBuy: price > 0,
          price,
        };
        if (listMyToken.includes(tokenId)) listTokenDetail.push(item);
        else listNotMyTokenDetail.push(item);
      }
      this.setState({
        homes: listTokenDetail,
        not_my_homes: listNotMyTokenDetail,
      });
      this.setLoadingEnd();
    } catch (error) {
      console.error(error);

      this.setLoadingEnd();
    }
  };

  transferNft = async (tokenId, to_address) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      await contract.methods
        .transferFrom(this.state.chainaccount, to_address, tokenId)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      console.error(error);

      this.setLoadingEnd();
    } finally {
      this.hideTransferNFT();
    }
  };

  sellNft = async (tokenId, set_price) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      const price = parseFloat(set_price);
      const unitPrice = BigInt(price * 10 ** 18);
      await contract.methods
        .allowBuy(tokenId, unitPrice)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      console.log(error);
      this.setLoadingEnd();
    } finally {
      this.hideSellNFT();
    }
  };
  unSellNft = async (tokenId) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      await contract.methods
        .disallowBuy(tokenId)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      console.log(error);
      this.setLoadingEnd();
    }
  };

  buyNft = async (tokenId, price) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      await contract.methods
        .buy(tokenId)
        .send({ from: this.state.chainaccount, value: price });
      await this.getListNft();
    } catch (error) {
      console.error(error);

      this.setLoadingEnd();
    }
  };

  mint = async (addressofhouse, description, image) => {
    try {
      this.setLoadingStart();
      const tokenuri = await this.reqtokenuri(
        addressofhouse,
        description,
        image
      );
      console.log("tokenuri:", tokenuri);
      const house = await this.state.chaincontract.methods
        .mint(tokenuri)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      console.error(error);
      this.setLoadingEnd();
    } finally {
      this.hideMintNFT();
    }
  };

  showMintNFT = () => {
    this.setState({
      isShowMintNFT: true,
    });
  };

  hideMintNFT = () => {
    this.setState({
      isShowMintNFT: false,
    });
  };

  showTransferNFT = (token) => {
    this.setState({
      isShowTransferNFT: true,
      transferNftData: token,
    });
  };

  hideTransferNFT = () => {
    this.setState({
      isShowTransferNFT: false,
      transferNftData: null,
    });
  };

  showSellNFT = (token) => {
    this.setState({
      isShowSellNFT: true,
      sellNftData: token,
    });
  };

  hideSellNFT = () => {
    this.setState({
      isShowSellNFT: false,
      sellNftData: null,
    });
  };

  render() {
    return (
      <div className="App">
        <ModalMintNFT
          isShow={this.state.isShowMintNFT}
          onSubmit={this.mint}
          onClose={this.hideMintNFT}
        />
        <ModalTransferNFT
          isShow={this.state.isShowTransferNFT}
          onSubmit={this.transferNft}
          onClose={this.hideTransferNFT}
          token={this.state.transferNftData}
        />
        <ModalSellNFT
          isShow={this.state.isShowSellNFT}
          onSubmit={this.sellNft}
          onClose={this.hideSellNFT}
          token={this.state.sellNftData}
        />
        <span> </span>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="https://github.com/neckgamervn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bất động sản NFT
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <div className="text-white">
                <span id="account">Địa chỉ ví: {this.state.chainaccount}</span>
              </div>
            </li>
            <li className="">
              <div className="text-white">
                <span>Số lượng ETH: {this.state.balance}</span>
              </div>
            </li>
          </ul>
        </nav>
        {!!this.state.loading && (
          <div className="overlay">
            <div className="overlayDoor"></div>
            <div className="overlayContent">
              <div className="loader">
                <div className="inner"></div>
              </div>
            </div>
          </div>
        )}
        <div style={{ flexDirection: "row", display: "flex" }}>
          <div
            style={{
              flex: 1,
            }}
          >
            <button className="btn-3" onClick={this.showMintNFT}>
              Tạo NFT
            </button>
            <p />
            <h1 id="title"> Danh sách token sở hữu</h1>
            {this.state.homes.map((house, idx) => (
              <div
                key={idx}
                style={{
                  marginTop: 30,
                  flexDirection: "column",
                  display: "flex",
                  width: 380,
                }}
              >
                <NFTItem token={house} />

                <div
                  style={{
                    marginTop: 10,
                  }}
                >
                  <button
                    className="btn-1"
                    style={{
                      width: 100,
                      marginRight: 10,
                    }}
                    onClick={() => {
                      this.showTransferNFT(house);
                    }}
                  >
                    Chuyển
                  </button>

                  {house.isBuy ? (
                    <button
                      className="btn-2"
                      style={{
                        width: 150,
                      }}
                      onClick={() => {
                        this.unSellNft(house.tokenId);
                      }}
                    >
                      Huỷ lệnh bán
                    </button>
                  ) : (
                    <button
                      className="btn-2"
                      style={{
                        width: 150,
                      }}
                      onClick={() => {
                        this.showSellNFT(house);
                      }}
                    >
                      Đặt lệnh bán
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginTop: 30 }} id="title">
              Chợ token
            </h1>
            {this.state.not_my_homes.map((house, idx) =>
              house.isBuy ? (
                <div
                  key={idx}
                  style={{
                    marginTop: 30,
                  }}
                >
                  <NFTItem token={house} />

                  <div style={{ marginTop: 10 }}>
                    <button
                      className="btn-2"
                      onClick={() => {
                        this.buyNft(house.tokenId, house.price);
                      }}
                    >
                      Mua
                    </button>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    Owner address: {house.owner}
                  </div>
                </div>
              ) : (
                <></>
              )
            )}
          </div>
        </div>
      </div>
    );
  }
}
export default Application;

/* global BigInt */
import web3 from "web3";
import React, { Component } from "react";
import "./Styles.css";
import Estatejson from "../build/contracts/Estate.json";

import { pinJSONToIPFS } from "./MintFunc";

class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connect: false,
      chainaccount: "",
      chaincontract: null,
      home_address: "",
      to_address: "",
      set_price: "",
      userid: "",
      ipfskey: "622e46a319ab34ff19eb",
      ipfssecret:
        "b30bb9ff92870d5e462d0e6b1d5b9be4cc3ebde0a2ad659c956bf64337796b9e",
      homes: [],
      not_my_homes: [],
      loading: true,
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
      console.log(this.state.chaincontract);
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
        // const tokenId = await contract.methods.tokenByIndex(i).call();
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
      this.setLoadingEnd();
    }
  };

  transferNft = async (tokenId) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      await contract.methods
        .transferFrom(this.state.chainaccount, this.state.to_address, tokenId)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      this.setLoadingEnd();
    }
  };

  sellNft = async (tokenId) => {
    try {
      this.setLoadingStart();
      const contract = this.state.chaincontract;
      const price = parseFloat(this.state.set_price);
      const unitPrice = BigInt(price * 10 ** 18);
      await contract.methods
        .allowBuy(tokenId, unitPrice)
        .send({ from: this.state.chainaccount });
      await this.getListNft();
    } catch (error) {
      console.log(error);
      this.setLoadingEnd();
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
      this.setLoadingEnd();
    }
  };

  render() {
    return (
      <div className="App">
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
              <small className="text-white">
                <span id="account">Địa chỉ ví: {this.state.chainaccount}</span>
              </small>
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
          <div style={{ flex: 1 }}>
            <h1 id="title"> Mint a House 🏠</h1>
            <p></p>
            <form>
              <h3>Số nhà, địa chỉ : </h3>
              <input
                type="text"
                placeholder="Ví dụ: 234 Hoàng Quốc Việt"
                onChange={(event) =>
                  this.setState({ homeaddress: event.target.value })
                }
              />
              <h3>Thông tin nhà: </h3>
              <input
                type="text"
                placeholder="Ví dụ: Nhà 5 phòng ngủ , ban công nhìn ra tây hồ"
                onChange={(event) =>
                  this.setState({ homedescription: event.target.value })
                }
              />
              <p />
              <h3>Ảnh: </h3>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  var file = event.target.files[0];
                  var reader = new FileReader();
                  var url = reader.readAsDataURL(file);
                  reader.onloadend = function (e) {
                    this.setState({
                      image: reader.result,
                    });
                  }.bind(this);
                }}
              />
              <img height={350} src={this.state.image} />
            </form>
            <br></br>
            <button
              className="btn-2"
              id="mintButton"
              onClick={() =>
                this.mint(
                  this.state.homeaddress,
                  this.state.homedescription,
                  this.state.image
                )
              }
            >
              Mint NFT
            </button>
            <br />
            <br />
            <br />
            <h1 id="title"> Danh sách token sở hữu và chuyển token </h1>
            <input
              type="text"
              placeholder="Tới địa chỉ"
              onChange={(event) =>
                this.setState({ to_address: event.target.value })
              }
            />
            <p />
            <input
              type="text"
              style={{ width: 200 }}
              placeholder="Giá đặt lệnh bán (ETH)"
              onChange={(event) =>
                this.setState({ set_price: event.target.value })
              }
            />
            {this.state.homes.map((house, idx) => (
              <div
                key={idx}
                style={{
                  marginTop: 30,
                }}
              >
                <button
                  className="btn-3"
                  onClick={() => {
                    window.open(house.tokenURI);
                  }}
                >
                  <div>Địa chỉ: {house.tokenData.address}</div>
                  <div>Mô tả: {house.tokenData.description}</div>
                  <img height={200} src={house.tokenData.image} />
                  {house.price > 0 && (
                    <div>Giá: {parseFloat(house.price) / 10 ** 18} ETH</div>
                  )}
                </button>

                <button
                  className="btn-1"
                  style={{
                    width: 100,
                  }}
                  onClick={() => {
                    this.transferNft(house.tokenId);
                  }}
                >
                  Chuyển
                </button>

                {house.isBuy ? (
                  <button
                    className="btn-2"
                    style={{
                      width: 100,
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
                      width: 100,
                    }}
                    onClick={() => {
                      this.sellNft(house.tokenId);
                    }}
                  >
                    Đặt lệnh bán
                  </button>
                )}
              </div>
            ))}
            <br />
            <br />
            <br />
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
                  <button
                    className="btn-3"
                    onClick={() => {
                      window.open(house.tokenURI);
                    }}
                  >
                    <div>Địa chỉ: {house.tokenData.address}</div>
                    <div>Mô tả: {house.tokenData.description}</div>
                    <img height={200} src={house.tokenData.image} />
                    {house.price > 0 && (
                      <div>Giá: {parseFloat(house.price) / 10 ** 18} ETH</div>
                    )}
                  </button>
                  <button
                    className="btn-2"
                    onClick={() => {
                      this.buyNft(house.tokenId, house.price);
                    }}
                  >
                    Mua: {parseFloat(house.price) / 10 ** 18} ETH
                  </button>
                  <div>Owner address: {house.owner}</div>
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

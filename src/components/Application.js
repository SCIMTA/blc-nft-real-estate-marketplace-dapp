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
      userid: "",
      ipfskey: "622e46a319ab34ff19eb",
      ipfssecret:
        "b30bb9ff92870d5e462d0e6b1d5b9be4cc3ebde0a2ad659c956bf64337796b9e",
      homes: [],
      all_homes: [],
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

  reqtokenuri = async (address, description) => {
    const metadata = new Object();
    metadata.address = address;
    metadata.description = description;

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
    const contract = this.state.chaincontract;
    const totalSupply = await contract.methods.totalSupply().call();
    const listMyToken = await contract.methods
      .tokensOfOwner(this.state.chainaccount)
      .call();
    let listToken = [];
    let listAllToken = [];
    for (let i = 0; i < totalSupply; i++) {
      const tokenId = await contract.methods.tokenByIndex(i).call();
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      const owner = await contract.methods.ownerOf(tokenId).call();
      const item = {
        tokenId,
        tokenURI,
        owner,
      };
      if (listMyToken.includes(tokenId)) {
        listToken.push(item);
      }

      listAllToken.push(item);
    }
    this.setState({ homes: listToken, all_homes: listAllToken });
  };

  transferNft = async (tokenId) => {
    const contract = this.state.chaincontract;
    await contract.methods
      .transferFrom(this.state.chainaccount, this.state.to_address, tokenId)
      .send({ from: this.state.chainaccount });
    await this.getListNft();
  };

  mint = async (addressofhouse, description) => {
    const tokenuri = await this.reqtokenuri(addressofhouse, description);
    console.log("tokenuri:", tokenuri);
    const house = await this.state.chaincontract.methods
      .mint(tokenuri)
      .send({ from: this.state.chainaccount });
    console.log("house", house);
    console.log("success");
    await this.getListNft();
    // this.setState((prevState) => ({
    //   homes: prevState.homes.concat({ ...house, tokenuri }),
    // }));
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
            NFT Real Estate
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">
                <span id="account">
                  account name: {this.state.chainaccount}
                </span>
              </small>
            </li>
          </ul>
        </nav>
        <br></br>
        <br></br>
        <h1 id="title"> Mint a House 🏠</h1>
        <p></p>
        <form>
          <h3>Địa chỉ nhà: </h3>
          <input
            type="text"
            placeholder="e.g. 123 Duke Drive!"
            onChange={(event) =>
              this.setState({ homeaddress: event.target.value })
            }
          />
          <h3>Thông tin nhà: </h3>
          <input
            type="text"
            placeholder="e.g. 5 bedrooms 2 baths"
            onChange={(event) =>
              this.setState({ homedescription: event.target.value })
            }
          />
        </form>
        <br></br>
        <button
          className="btn-2"
          id="mintButton"
          onClick={() =>
            this.mint(this.state.homeaddress, this.state.homedescription)
          }
        >
          Mint NFT
        </button>
        <p />
        <h1 id="title"> Danh sách token sở hữu và chuyển token </h1>
        <input
          type="text"
          placeholder="Tới địa chỉ"
          onChange={(event) =>
            this.setState({ to_address: event.target.value })
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
              token id {house.tokenId}
            </button>

            <button
              className="btn-1"
              style={{ width: 100 }}
              onClick={() => {
                this.transferNft(house.tokenId);
              }}
            >
              Transfer
            </button>
          </div>
        ))}

        <h1 style={{ marginTop: 30 }} id="title">
          Danh toàn bộ token
        </h1>
        {this.state.all_homes.map((house, idx) => (
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
              Token id {house.tokenId}
            </button>
            <div>Owner address: {house.owner}</div>
          </div>
        ))}
      </div>
    );
  }
}
export default Application;

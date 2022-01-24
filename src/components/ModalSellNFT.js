import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import NFTItem from "./NFTItem";

export const ModalSellNFT = (props) => {
  const [price, setPrice] = useState("");
  const clearData = () => {
    setPrice("");
  };
  const { onClose, onSubmit, isShow, token } = props;
  return (
    <Modal show={isShow} onHide={onClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Đặt lệnh bán NFT</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: "center" }}>
        {token && <NFTItem token={token} />}
        <p></p>
        <input
          type="text"
          placeholder="Giá trị NFT (ETH)"
          onChange={(event) => setPrice(event.target.value)}
        />
        <p></p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            onSubmit(token.tokenId, price);
            clearData();
          }}
          variant="primary"
        >
          Đặt lệnh bán
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalSellNFT;

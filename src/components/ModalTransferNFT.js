import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import NFTItem from "./NFTItem";

export const ModalTransferNFT = (props) => {
  const [toAddress, setToAddress] = useState("");
  const clearData = () => {
    setToAddress("");
  };
  const { onClose, onSubmit, isShow, token } = props;
  return (
    <Modal show={isShow} onHide={onClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Chuyển NFT</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: "center" }}>
        {token && <NFTItem token={token} />}
        <p></p>
        <input
          type="text"
          placeholder="Tới địa chỉ"
          onChange={(event) => setToAddress(event.target.value)}
        />
        <p></p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            onSubmit(token.tokenId, toAddress);
            clearData();
          }}
          variant="primary"
        >
          Chuyển
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalTransferNFT;

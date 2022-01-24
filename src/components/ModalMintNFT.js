import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

export const ModalMintNFT = (props) => {
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const clearData = () => {
    setAddress("");
    setDescription("");
    setImage("");
  };
  const { onClose, onSubmit, isShow } = props;
  return (
    <Modal show={isShow} onHide={onClose} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Mint a House 🏠</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: "center" }}>
        <h3>Số nhà, địa chỉ : </h3>
        <input
          type="text"
          placeholder="Ví dụ: 234 Hoàng Quốc Việt"
          onChange={(event) => setAddress(event.target.value)}
        />
        <p></p>
        <h3>Thông tin nhà: </h3>
        <input
          type="text"
          placeholder="Ví dụ: Nhà 5 phòng ngủ , ban công nhìn ra tây hồ"
          onChange={(event) => setDescription(event.target.value)}
        />
        <p></p>
        <h3>Ảnh: </h3>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            var file = event.target.files[0];
            var reader = new FileReader();
            var url = reader.readAsDataURL(file);
            reader.onloadend = function (e) {
              setImage(reader.result);
            }.bind(this);
          }}
        />
        <p></p>
        <img height={350} src={image} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            onSubmit(address, description, image);
            clearData();
          }}
          variant="primary"
        >
          Tạo
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalMintNFT;

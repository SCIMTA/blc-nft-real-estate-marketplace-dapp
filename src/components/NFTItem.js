import React from "react";

export const NFTItem = (props) => {
  const { token } = props;
  return (
    <button
      className="btn-3"
      onClick={() => {
        window.open(token.tokenURI);
      }}
    >
      <div>Địa chỉ: {token.tokenData.address}</div>
      <div>Mô tả: {token.tokenData.description}</div>
      <img
        style={{
          height: 200,
          width: 350,
        }}
        src={token.tokenData.image}
      />
      {token.price > 0 && (
        <div>Giá: {parseFloat(token.price) / 10 ** 18} ETH</div>
      )}
    </button>
  );
};

export default NFTItem;

import React from "react";

type Order = {
  id: number;
  item: string;
  quantity: number;
};

interface OrderListProps {
  orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>
          {order.item} - {order.quantity}
        </li>
      ))}
    </ul>
  );
};

export default OrderList;
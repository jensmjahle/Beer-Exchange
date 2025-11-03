import { createTransaction } from "./transactions.service";

// Example adapter; call createTransaction under the hood
export async function createOrder({
  eventId,
  eventBeerId = null,
  customerId = null,
  qty = 1,
  unitPrice,
}) {
  return createTransaction({
    event_id: eventId,
    event_beer_id: eventBeerId,
    customer_id: customerId,
    qty,
    unit_price: unitPrice,
  });
}

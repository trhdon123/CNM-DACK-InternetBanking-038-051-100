import { combineReducers } from "redux";
import payAccStaffReducer from "./payAccStaffReducer";
import customersReducer from "./customersReducer";
import payAccClientReducer from "./payAccClientReducer";
import contactsReducer from "./contactsReducer";
import internalTransferReducer from "./internalTransferReducer";

const indexReducer = combineReducers({
  payAccStaff: payAccStaffReducer,
  customers: customersReducer,
  payAccClient: payAccClientReducer,
  contacts: contactsReducer,
  internalTransfer: internalTransferReducer
});

export default indexReducer;

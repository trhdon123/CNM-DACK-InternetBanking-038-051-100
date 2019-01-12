import * as payAccClientConstants from "../constants/payAccClientConstants";
import * as messageConstants from "../constants/messageConstants";

const initState = {
  payAccs: [],
  histories: [],
  // pay in panel
  payAccId: "",
  accNumber: "",
  currentBalance: 0,
  // for dialog confirming closing payment account
  isDialogClosePayAccOpen: false,
  // for dialog viewing payment account history
  isDialogHistoryPayAccOpen: false,
  // transfer remaining balance of closing payment account to current customer's another one
  receiverPayAccNumber: "",
  // for notify message
  isMessageOpen: false,
  messageType: "",
  message: "",
  reload: false
};

const payAccClientReducer = (state = initState, action) => {
  const { accNumber } = state;
  switch (action.type) {
    case payAccClientConstants.GET_PAY_ACCS_LIST_SUCCEED:
      return { ...state, payAccs: action.payload.payAccs };
    case payAccClientConstants.OPEN_CLOSE_PAY_ACC_DIALOG:
      return { ...state, ...action.payload, isDialogClosePayAccOpen: true };
    case payAccClientConstants.HANDLE_CLOSE_PAY_ACC_SUCCEED:
      return {
        ...state, // reset
        payAccId: "",
        accNumber: "",
        receiverPayAccNumber: "",
        // show message
        messageType: "success",
        isMessageOpen: true,
        message: `Successfully closed payment account ${accNumber}`,
        // close dialog
        isDialogClosePayAccOpen: false,
        reload: !state.reload
      };
    case payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR:
      return {
        ...state,
        messageType: "error",
        isMessageOpen: true,
        message: `Sorry, failed closing payment account ${accNumber}`,
        isDialogClosePayAccOpen: false
      };
    case payAccClientConstants.CLOSE_CLOSE_PAY_ACC_DIALOG:
      return {
        ...state,
        isDialogClosePayAccOpen: false,
        payAccId: "",
        accNumber: "",
        currentBalance: 0,
        receiverPayAccNumber: ""
      };
    case payAccClientConstants.OPEN_VIEW_HISTORY_DIALOG:
      return { ...state, ...action.payload, isDialogHistoryPayAccOpen: true };
    case payAccClientConstants.CLOSE_VIEW_HISTORY_DIALOG:
      return {
        ...state,
        payAccId: "",
        accNumber: "",
        currentBalance: 0,
        isDialogHistoryPayAccOpen: false
      };
    case messageConstants.CLOSE_MESSAGE:
      return { ...state, isMessageOpen: false };
    default:
      return state;
  }
};

export default payAccClientReducer;

import * as internalTransferConstants from "../constants/internalTransferConstants";
import { GET_CONTACTS_LIST_SUCCEED } from "../constants/contactsConstants";
import * as messageConstants from "../constants/messageConstants";

const initState = {
  // sender info
  payAccs: [],
  payAccsTransferable: [],
  payAccId: "",
  currentBalance: 0,
  // for notify message
  isMessageOpen: false,
  messageType: "",
  message: "",
  // receiver info
  receiverPayAccId: "",
  receiverPayAccNumber: "",
  receiverName: "",
  receiverEmail: "",
  receiverPhone: "",
  receiverCurrentBalance: 0,
  // transaction info
  transferAmount: "",
  transferMsg: "",
  feeType: "1",
  isDialogOTPOpen: false,
  checkOTP: null,
  OTP: "",
  // option to save contact if not existed
  contacts: [],
  isInContacts: true,
  // disable auto-save for contact by default in case API check failed
  saveContact: true,
  reload: false
};

const internalTransferReducer = (state = initState, action) => {
  switch (action.type) {
    case internalTransferConstants.GET_PAY_ACCS_LIST_SUCCEED:
      return { ...state, ...action.payload };
    case GET_CONTACTS_LIST_SUCCEED:
      const contacts = action.payload.map(contact => ({
        label: contact.toNickName,
        value: contact.toAccNumber
      }));
      return { ...state, contacts };
    case internalTransferConstants.OPEN_OTP_DIALOG:
      return { ...state, ...action.payload, isDialogOTPOpen: true };
    case internalTransferConstants.CLOSE_OTP_DIALOG:
      return {
        ...state,
        receiverPayAccId: "",
        receiverName: "",
        receiverEmail: "",
        receiverPhone: "",
        receiverCurrentBalance: 0,
        checkOTP: null,
        OTP: "",
        saveContact: true,
        isInContacts: true,
        isDialogOTPOpen: false
      };
    case internalTransferConstants.HANDLE_INPUT_CHANGE:
      const { name, value, ...rest } = action.payload;
      return { ...state, [name]: value, ...rest };
    case internalTransferConstants.HANDLE_TRANSFER_SUCCEED:
      return {
        ...state,
        ...action.payload,
        isDialogOTPOpen: false,
        messageType: "success",
        isMessageOpen: true,
        message: "Successfully operated the transaction",
        // reset form
        receiverPayAccNumber: "",
        transferAmount: "",
        feeType: "1",
        transferMsg: "",
        OTP: "",
        checkOTP: "",
        saveContact: true,
        isInContacts: true
      };
    case internalTransferConstants.HANDLE_TRANSFER_ERROR:
      return {
        ...state,
        messageType: "error",
        message: "Sorry, transaction failed",
        receiverPayAccId: "",
        receiverName: "",
        receiverEmail: "",
        receiverPhone: "",
        receiverCurrentBalance: 0,
        checkOTP: null,
        OTP: "",
        saveContact: true,
        isInContacts: true,
        isDialogOTPOpen: false
      };
    case messageConstants.OPEN_MESSAGE:
      return { ...state, ...action.payload, isMessageOpen: true };
    case messageConstants.CLOSE_MESSAGE:
      return { ...state, isMessageOpen: false };
    default:
      return state;
  }
};

export default internalTransferReducer;

import axios from "axios";
import { getCookie } from "tiny-cookie";
import { getUserInfo } from "../../utils/authHelper";
import * as internalTransferConstants from "../constants/internalTransferConstants";
import * as messageConstants from "../constants/messageConstants";

export const getPayAccsList = () => dispatch => {
  const customerId = getUserInfo("f_id"),
    accessToken = getCookie("access_token");
  if (!customerId || !accessToken) {
    return {
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, could not get your entity, please sign in again"
      }
    };
  }

  axios
    .get(`http://localhost:3001/pay-accs/${customerId}`, {
      headers: {
        "x-access-token": accessToken
      }
    })
    .then(resp => {
      const { status, data } = resp;
      if (status === 200) {
        // only accounts with balance > 0
        const payAccs = data,
          payAccsTransferable = data.filter(payAcc => payAcc.balance > 0);
        if (payAccs.length > 0) {
          dispatch({
            type: internalTransferConstants.GET_PAY_ACCS_LIST_SUCCEED,
            payload: {
              payAccs,
              payAccsTransferable
            }
          });
        }
      } else {
        dispatch({
          type: messageConstants.OPEN_MESSAGE,
          payload: {
            messageType: "error",
            message: "Sorry, failed getting your payment accounts list"
          }
        });
        throw new Error(
          "Something went wrong when getting payment accounts list, status ",
          status
        );
      }
    })
    .catch(err => {
      dispatch({
        type: messageConstants.OPEN_MESSAGE,
        payload: {
          messageType: "error",
          message: "Sorry, failed getting your payment accounts list"
        }
      });
      console.log(err);
    });
};

export const openOTPDialog = (
  receiverPayAccNumber,
  feeType,
  currentBalance,
  transferAmount
) => dispatch => {
  const clientName = getUserInfo("f_name"),
    clientEmail = getUserInfo("f_email"),
    customerId = getUserInfo("f_id"),
    accessToken = getCookie("access_token");

  if (
    !clientName ||
    !clientEmail ||
    !customerId ||
    !accessToken ||
    !receiverPayAccNumber ||
    isNaN(feeType) ||
    isNaN(currentBalance) ||
    isNaN(transferAmount)
  ) {
    return {
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, could not get your entity, please sign in again"
      }
    };
  }

  axios
    .all([
      axios.post(
        "http://localhost:3001/send-otp",
        {
          clientEmail,
          clientName
        },
        {
          headers: {
            "x-access-token": accessToken
          }
        }
      ),
      axios.get(`http://localhost:3001/pay-acc/${receiverPayAccNumber}`, {
        headers: {
          "x-access-token": accessToken
        }
      }),
      axios.get(
        `http://localhost:3001/contact/${receiverPayAccNumber}/is-existed?customerId=${customerId}`,
        {
          headers: {
            "content-type": "application/json",
            "x-access-token": accessToken
          }
        }
      )
    ])
    .then(
      axios.spread((getOTP, getReceiver, getContactExisted) => {
        if (getOTP.status !== 201) {
          dispatch({
            type: messageConstants.OPEN_MESSAGE,
            payload: {
              messageType: "error",
              message:
                "Sorry, failed sending request for OTP, please try again later"
            }
          });
          throw new Error(
            "Something went wrong when requesting for OTP, status ",
            getOTP.status
          );
        }

        if (getReceiver.status !== 200) {
          dispatch({
            type: messageConstants.OPEN_MESSAGE,
            payload: {
              messageType: "error",
              message:
                "Sorry, failed getting receiver details , please try again later"
            }
          });
          throw new Error(
            "Something went wrong when getting receiver details, status ",
            getOTP.status
          );
        }

        if (getReceiver.data.length < 1) {
          return dispatch({
            type: messageConstants.OPEN_MESSAGE,
            payload: {
              messageType: "warning",
              message: `No payment account attached to ${receiverPayAccNumber}, please try another one`
            }
          });
        }

        const {
          id: receiverPayAccId,
          clientName: receiverName,
          clientEmail: receiverEmail,
          phone: receiverPhone,
          balance: receiverCurrentBalance
        } = getReceiver.data[0];
        const receiverFee = +feeType === 2 ? 10000 : 0;
        if (
          +feeType === 2 &&
          +receiverFee >= +receiverCurrentBalance + +transferAmount
        ) {
          return dispatch({
            type: messageConstants.OPEN_MESSAGE,
            payload: {
              messageType: "error",
              message: "Transaction failed. Contact your receiver for detail."
            }
          });
        }

        const {
          data: { otp: checkOTP }
        } = getOTP;
        const isInContacts = +getContactExisted.data.existed === 1;
        dispatch({
          type: internalTransferConstants.OPEN_OTP_DIALOG,
          payload: {
            checkOTP,
            receiverPayAccId,
            receiverName,
            receiverEmail,
            receiverPhone,
            receiverPayAccNumber,
            receiverCurrentBalance,
            isInContacts
          }
        });
      })
    )
    .catch(err => {
      dispatch({
        type: messageConstants.OPEN_MESSAGE,
        payload: {
          messageType: "error",
          message:
            "Sorry, failed sending request for OTP or getting receiver details, please try again later"
        }
      });
      console.log(err);
    });
};

export const closeOTPDialog = () => ({
  type: internalTransferConstants.CLOSE_OTP_DIALOG
});

export const handleTransfer = (
  payAccId,
  accNumber,
  currentBalance,
  transferAmount,
  receiverPayAccId,
  receiverPayAccNumber,
  receiverName,
  receiverCurrentBalance,
  feeType,
  transferMsg,
  saveContact,
  isInContacts,
  reload
) => dispatch => {
  const accessToken = getCookie("access_token"),
    customerId = getUserInfo("f_id");
  if (
    !payAccId ||
    !accNumber ||
    isNaN(currentBalance) ||
    isNaN(transferAmount) ||
    !receiverPayAccId ||
    !receiverPayAccNumber ||
    !receiverName ||
    isNaN(receiverCurrentBalance) ||
    isNaN(feeType) ||
    !transferMsg ||
    !accessToken ||
    !customerId
  ) {
    return {
      type: internalTransferConstants.HANDLE_TRANSFER_ERROR
    };
  }

  const senderFee = +feeType === 1 ? 10000 : 0,
    receiverFee = +feeType === 2 ? 10000 : 0;

  const axiosArr = [
    axios.patch(
      "http://localhost:3001/pay-acc/balance",
      {
        payAccId,
        newBalance: +currentBalance - +transferAmount - senderFee
      },
      {
        headers: {
          "x-access-token": accessToken
        }
      }
    ),
    axios.patch(
      "http://localhost:3001/pay-acc/balance",
      {
        payAccId: receiverPayAccId,
        newBalance: +receiverCurrentBalance + +transferAmount - receiverFee
      },
      {
        headers: {
          "x-access-token": accessToken
        }
      }
    ),
    axios.post(
      "http://localhost:3001/history",
      {
        payAccId,
        fromAccNumber: accNumber,
        toAccNumber: receiverPayAccNumber,
        amount: transferAmount,
        transactionType: "sent",
        feeType: senderFee,
        message: transferMsg
      },
      {
        headers: {
          "x-access-token": accessToken
        }
      }
    ),
    axios.post(
      "http://localhost:3001/history",
      {
        payAccId: receiverPayAccId,
        fromAccNumber: accNumber,
        toAccNumber: receiverPayAccNumber,
        amount: transferAmount,
        transactionType: "received",
        feeType: receiverFee,
        message: transferMsg
      },
      {
        headers: {
          "x-access-token": accessToken
        }
      }
    )
  ];

  if (saveContact === true && isInContacts === false)
    axiosArr.push(
      axios.post(
        "http://localhost:3001/contact",
        {
          customerId,
          toAccNumber: receiverPayAccNumber,
          toNickName: receiverName
        },
        {
          headers: {
            "x-access-token": accessToken
          }
        }
      )
    );

  axios
    .all([...axiosArr])
    .then(
      axios.spread(
        (
          updateSenderPayAcc,
          updateReceiverPayAcc,
          sendHistory,
          receiveHistory
        ) => {
          if (
            updateSenderPayAcc.status !== 201 ||
            updateReceiverPayAcc.status !== 201 ||
            sendHistory.status !== 201 ||
            receiveHistory.status !== 201
          ) {
            dispatch({
              type: internalTransferConstants.HANDLE_TRANSFER_ERROR
            });
            throw new Error(
              "Something went wrong while operating transaction, status ",
              updateSenderPayAcc.status,
              updateReceiverPayAcc.status,
              sendHistory.status,
              receiverCurrentBalance.status
            );
          } else {
            dispatch({
              type: internalTransferConstants.HANDLE_TRANSFER_SUCCEED,
              payload: {
                currentBalance:
                  +currentBalance -
                  +transferAmount -
                  (+feeType === 1 ? 10000 : 0),
                reload: !reload
              }
            });
          }
        }
      )
    )
    .catch(err => {
      dispatch({
        type: internalTransferConstants.HANDLE_TRANSFER_ERROR
      });
      console.log(err);
    });
};

// _name used for specified checkbox control
export const handleInputChange = (e, payAccs, _name) => {
  const { name, value, checked } = e.target;

  if (name === "payAccId") {
    const accNumber = payAccs.find(payAcc => payAcc.id === value).accNumber,
      currentBalance = +payAccs.find(payAcc => payAcc.id === value).balance;
    return {
      type: internalTransferConstants.HANDLE_INPUT_CHANGE,
      payload: {
        name,
        value,
        accNumber,
        currentBalance
      }
    };
  }

  return {
    type: internalTransferConstants.HANDLE_INPUT_CHANGE,
    payload: {
      name: _name || name,
      value: value !== undefined ? value : checked
    }
  };
};

export const closeMessage = () => ({
  type: messageConstants.CLOSE_MESSAGE
});

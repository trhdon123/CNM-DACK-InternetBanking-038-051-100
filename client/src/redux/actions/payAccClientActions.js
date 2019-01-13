import axios from "axios";
import { getCookie } from "tiny-cookie";
import { getUserInfo } from "../../utils/authHelper";
import * as payAccClientConstants from "../constants/payAccClientConstants";
import * as messageConstants from "../constants/messageConstants";

export const getPayAccsList = customerId => dispatch => {
  const customerId = getUserInfo("f_id");
  if (!customerId)
    return {
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, could not get user entity, please sign in again"
      }
    };

  axios
    .get(`http://localhost:3001/pay-accs/${customerId}`, {
      headers: {
        "x-access-token": getCookie("access_token")
      }
    })
    .then(resp => {
      const { status, data: payAccs } = resp;
      if (status === 200) {
        return dispatch({
          type: payAccClientConstants.GET_PAY_ACCS_LIST_SUCCEED,
          payload: { payAccs }
        });
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

export const openClosePayAccDialog = (
  payAccId,
  accNumber,
  currentBalance,
  payAccs
) => {
  if (!payAccId || !accNumber || isNaN(currentBalance) || !payAccs)
    return {
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, could not get this payment account information"
      }
    };

  return {
    type: payAccClientConstants.OPEN_CLOSE_PAY_ACC_DIALOG,
    payload: {
      payAccId,
      accNumber,
      currentBalance,
      receiverPayAccNumber: payAccs.filter(
        payAcc => payAccId !== payAcc.id && payAcc.status === "OPEN"
      )[0].accNumber
    }
  };
};

export const handleClosePayAcc = (
  payAccId,
  accNumber,
  currentBalance,
  receiverPayAccNumber
) => dispatch => {
  const accessToken = getCookie("access_token");
  if (
    !payAccId ||
    !accNumber ||
    isNaN(currentBalance) ||
    !receiverPayAccNumber ||
    !accessToken
  )
    return {
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, failed getting this payment account information"
      }
    };

  // transfer remaining balance
  if (+currentBalance > 0) {
    // get info of payacc that receives
    axios
      .get(`http://localhost:3001/pay-acc/${receiverPayAccNumber}`, {
        headers: {
          "x-access-token": accessToken
        }
      })
      .then(resp => {
        const { status } = resp;
        if (status === 200) {
          const {
            balance: receiverCurrentBalance,
            id: receiverPayAccId
          } = resp.data[0];
          // change balance of both account and update history
          axios
            .all([
              axios.patch(
                "http://localhost:3001/pay-acc/balance",
                {
                  payAccId,
                  newBalance: 0
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
                  newBalance: +receiverCurrentBalance + +currentBalance
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
                  amount: currentBalance,
                  transactionType: "closed",
                  message: "Close payment account",
                  feeType: 0
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
                  amount: currentBalance,
                  transactionType: "received",
                  message: "Receive",
                  feeType: 0
                },
                {
                  headers: {
                    "x-access-token": accessToken
                  }
                }
              )
            ])
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
                      type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR
                    });
                    throw new Error(
                      "Something went wrong when transferring remaining balance, status ",
                      updateSenderPayAcc.status,
                      updateReceiverPayAcc.status,
                      sendHistory.status,
                      receiveHistory.status
                    );
                  }
                }
              )
            );
        } else {
          dispatch({
            type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR
          });
          throw new Error(
            "Something went wrong when getting targeted account entity"
          );
        }
      })
      .catch(err => {
        dispatch({
          type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR
        });
        console.log(err);
      });
  }

  axios
    .patch(
      "http://localhost:3001/pay-acc/status/closed",
      {
        payAccId
      },
      {
        headers: {
          "x-access-token": accessToken
        }
      }
    )
    .then(resp => {
      const { status } = resp;
      if (status === 201) {
        dispatch({
          type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_SUCCEED
        });
      } else {
        dispatch({
          type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR
        });
        throw new Error(
          "Something went wrong when closing payment account, status ",
          status
        );
      }
    })
    .catch(err => {
      dispatch({
        type: payAccClientConstants.HANDLE_CLOSE_PAY_ACC_ERROR
      });
      console.log(err);
    });
};

export const closeClosePayAccDialog = () => ({
  type: payAccClientConstants.CLOSE_CLOSE_PAY_ACC_DIALOG
});

export const handleViewHistory = (payAccId, accNumber) => dispatch => {
  const accessToken = getCookie("access_token");
  if (!payAccId || !accNumber || !accessToken)
    return dispatch({
      type: messageConstants.OPEN_MESSAGE,
      payload: {
        messageType: "error",
        message: "Sorry, failed getting this payment account information"
      }
    });

  axios
    .get(`http://localhost:3001/histories/${payAccId}`, {
      headers: {
        "x-access-token": accessToken
      }
    })
    .then(resp => {
      const { status, data: histories } = resp;
      if (status === 200) {
        dispatch({
          type: payAccClientConstants.OPEN_VIEW_HISTORY_DIALOG,
          payload: {
            histories,
            accNumber
          }
        });
      } else {
        dispatch({
          messageType: "error",
          message: `Sorry, failed getting history of payment account ${accNumber}`
        });
        throw new Error(
          "Something went wrong getting history of payment account, status ",
          status
        );
      }
    })
    .catch(err => {
      dispatch({
        messageType: "error",
        message: `Sorry, failed getting history of payment account ${accNumber}`
      });
      console.log(err);
    });
};

export const closeViewHistoryDialog = () => ({
  type: payAccClientConstants.CLOSE_VIEW_HISTORY_DIALOG
});

export const handleInputChange = e => ({
  type: payAccClientConstants.HANDLE_INPUT_CHANGE,
  payload: {
    name: e.target.name,
    value: e.target.value
  }
});

export const closeMessage = () => ({
  type: messageConstants.CLOSE_MESSAGE
});

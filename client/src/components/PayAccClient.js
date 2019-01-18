import React, { Component } from "react";
import { connect } from "react-redux";
import Media from "react-media";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Icon,
  Radio,
  RadioGroup
} from "@material-ui/core";
import MUIDataTable from "mui-datatables";
import Message from "./Message";
import MustBeCustomer from "./HOCs/MustBeCustomer";
import * as payAccClientActions from "../redux/actions/payAccClientActions";
import * as messageActions from "../redux/actions/messageActions";

class PayAccClient extends Component {
  componentDidMount = () => {
    this.props.getPayAccsList();
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.reload !== this.props.reload) {
      this.props.getPayAccsList();
    }
  };

  render() {
    const {
      payAccs,
      histories,
      payAccId,
      accNumber,
      currentBalance,
      receiverPayAccNumber,
      isDialogClosePayAccOpen,
      isDialogHistoryPayAccOpen,
      messageType,
      message,
      isMessageOpen
    } = this.props;

    const MUIDataTableInfo = {
      default: {
        data: payAccs.map((payAcc, index) => {
          const { id, accNumber, balance, createdAt, status } = payAcc;
          return [
            index + 1,
            accNumber,
            balance,
            createdAt,
            <span style={{ color: status === "OPEN" ? "#008b00" : "#e54304" }}>
              {status}
            </span>,
            <Media query="(min-width: 1050px)">
              {match => (
                <div>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => this.props.handleViewHistory(id, accNumber)}
                  >
                    <Icon>history</Icon>
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={() =>
                      this.props.openClosePayAccDialog(
                        id,
                        accNumber,
                        balance,
                        payAccs
                      )
                    }
                    style={{
                      marginLeft: match ? "5px" : 0,
                      marginTop: match ? "0" : "5px"
                    }}
                    disabled={
                      status === "CLOSED" ||
                      payAccs.filter(payAcc => payAcc.status === "OPEN")
                        .length < 2
                    }
                  >
                    <Icon>delete</Icon>
                  </Button>
                </div>
              )}
            </Media>
          ];
        }),
        columns: ["#", "Number", "Balance", "Created at", "Status", "Action"],
        options: {
          selectableRows: false,
          responsive: "scroll",
          print: false,
          download: false,
          viewColumns: false,
          filter: false
        }
      },
      closePayAcc: {
        data: payAccs
          .filter(payAcc => payAcc.id !== payAccId && payAcc.status === "OPEN")
          .map((payAcc, index) => {
            const { accNumber: _accNumber, balance } = payAcc;
            return [
              <RadioGroup
                name="receiverPayAccNumber"
                value={
                  receiverPayAccNumber !== ""
                    ? receiverPayAccNumber
                    : index === 0 && _accNumber
                }
                onChange={this.props.handleInputChange}
              >
                <FormControlLabel
                  value={_accNumber}
                  control={
                    <Radio
                      color="primary"
                      checked={
                        (receiverPayAccNumber === "" && index === 0) ||
                        _accNumber === receiverPayAccNumber
                      }
                    />
                  }
                  label=""
                />
              </RadioGroup>,
              _accNumber,
              balance
            ];
          }),
        columns: ["Select", "Number", "Balance"],
        options: {
          selectableRows: false,
          responsive: "scroll",
          print: false,
          download: false,
          viewColumns: false,
          filter: false,
          rowsPerPage: 5,
          rowsPerPageOptions: [5, 10, 15]
        }
      },
      payAccHistory: {
        data: histories.map((history, index) => {
          const {
            fromAccNumber,
            toAccNumber,
            transactionType,
            amount,
            feeType,
            message: msg,
            createdAt
          } = history;
          return [
            index + 1,
            transactionType === "sent" ? toAccNumber : fromAccNumber,
            amount,
            transactionType.toUpperCase(),
            +feeType,
            msg,
            createdAt
          ];
        }),
        columns: [
          "#",
          "Sender/Receiver",
          "Amount",
          "Transaction type",
          "Extra fee",
          "Message",
          "Date time"
        ],
        options: {
          selectableRows: false,
          responsive: "scroll",
          print: false,
          download: false,
          viewColumns: false,
          filter: false,
          rowsPerPage: 5,
          rowsPerPageOptions: [5, 10]
        }
      }
    };

    return (
      <React.Fragment>
        <MUIDataTable
          title={"Payment accounts list"}
          data={MUIDataTableInfo.default.data}
          columns={MUIDataTableInfo.default.columns}
          options={MUIDataTableInfo.default.options}
        />

        {/* dialog to confirm closing payment account */}
        <Dialog
          open={isDialogClosePayAccOpen}
          onClose={this.props.closeClosePayAccDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {`Are you sure to close the payment account ${accNumber}?`}
          </DialogTitle>
          <DialogContent
            style={{ width: "600px", height: "auto", maxHeight: "1000px" }}
          >
            {currentBalance > 0 ? (
              <React.Fragment>
                <span>Balance of this payment account is {currentBalance}</span>
                <br />
                <span>
                  Please choose one of the following payment accounts to inherit
                  the remaining
                </span>
                <p />
                <MUIDataTable
                  title={"Payment accounts list"}
                  data={MUIDataTableInfo.closePayAcc.data}
                  columns={MUIDataTableInfo.closePayAcc.columns}
                  options={MUIDataTableInfo.closePayAcc.options}
                />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span>Balance of this payment account is 0</span>
                <br />
                <span>No further action required</span>
              </React.Fragment>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              size="small"
              onClick={this.props.closeClosePayAccDialog}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={() =>
                this.props.handleClosePayAcc(
                  payAccId,
                  accNumber,
                  currentBalance,
                  receiverPayAccNumber
                )
              }
              color="primary"
              autoFocus
            >
              Yes, I'm sure
            </Button>
          </DialogActions>
        </Dialog>

        {/* dialog to view selected payment account history */}
        <Dialog
          open={isDialogHistoryPayAccOpen}
          onClose={this.props.closeViewHistoryDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          fullWidth={true}
          maxWidth={"md"}
        >
          <DialogContent>
            <MUIDataTable
              title={`Recent activities of payment account ${accNumber}`}
              data={MUIDataTableInfo.payAccHistory.data}
              columns={MUIDataTableInfo.payAccHistory.columns}
              options={MUIDataTableInfo.payAccHistory.options}
            />
          </DialogContent>
          <DialogActions>
            <Button
              size="small"
              onClick={this.props.closeViewHistoryDialog}
              color="primary"
              autoFocus
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Message
          variant={messageType}
          message={message}
          open={isMessageOpen}
          onClose={this.props.closeMessage}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  ...state.payAccClient
});

const mapDispatchToProps = dispatch => ({
  getPayAccsList: () => dispatch(payAccClientActions.getPayAccsList()),
  openClosePayAccDialog: (payAccId, accNumber, currentBalance, payAccs) =>
    dispatch(
      payAccClientActions.openClosePayAccDialog(
        payAccId,
        accNumber,
        currentBalance,
        payAccs
      )
    ),
  handleClosePayAcc: (
    payAccId,
    accNumber,
    currentBalance,
    receiverPayAccNumber
  ) =>
    dispatch(
      payAccClientActions.handleClosePayAcc(
        payAccId,
        accNumber,
        currentBalance,
        receiverPayAccNumber
      )
    ),
  closeClosePayAccDialog: () =>
    dispatch(payAccClientActions.closeClosePayAccDialog()),
  handleViewHistory: (payAccId, accNumber) =>
    dispatch(payAccClientActions.handleViewHistory(payAccId, accNumber)),
  closeViewHistoryDialog: () =>
    dispatch(payAccClientActions.closeViewHistoryDialog()),
  handleInputChange: e => dispatch(payAccClientActions.handleInputChange(e)),
  closeMessage: () => dispatch(messageActions.closeMessage())
});

export default MustBeCustomer(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(PayAccClient)
);

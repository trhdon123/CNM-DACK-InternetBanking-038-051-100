import React, { Component } from "react";
import { connect } from "react-redux";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography
} from "@material-ui/core";
import Message from "./Message";
import MustBeCustomer from "./HOCs/MustBeCustomer";
import * as internalTransferActions from "../redux/actions/internalTransferActions";

class InternalTransfer extends Component {
  componentDidMount = () => {
    this.props.getPayAccsList();
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.reload !== this.props.reload) {
      this.props.getPayAccsList();
    }
  };

  checkInvalidInputs = () => {
    const {
      payAccs,
      currentBalance,
      receiverPayAccNumber,
      transferAmount,
      transferMsg,
      feeType
    } = this.props;

    if (receiverPayAccNumber === "") return true;

    if (
      transferAmount === "" ||
      +transferAmount < 1 ||
      +transferAmount > +currentBalance
    )
      return true;

    if (transferMsg === "") return true;

    if (
      payAccs.length > 0 &&
      payAccs.map(payAcc => payAcc.accNumber).includes(receiverPayAccNumber)
    )
      return true;

    const senderFee = +feeType === 1 ? 10000 : 0;
    if (+feeType === 1 && +senderFee >= +currentBalance - +transferAmount)
      return true;

    return false;
  };

  render() {
    const {
        payAccs,
        payAccsTransferable,
        payAccId,
        accNumber,
        currentBalance,
        transferAmount,
        transferMsg,
        receiverPayAccId,
        receiverCurrentBalance,
        receiverName,
        receiverEmail,
        receiverPhone,
        isMessageOpen,
        messageType,
        message,
        feeType,
        isDialogOTPOpen,
        OTP,
        checkOTP,
        saveContact,
        isInContacts,
        reload
      } = this.props,
      receiverPayAccNumber =
        (this.props.location.state &&
          this.props.location.state.receiverPayAccNumber) ||
        this.props.receiverPayAccNumber;

    return (
      <React.Fragment>
        <Grid container direction="row" justify="center" alignItems="center">
          <Paper className="paper inner-trans">
            {payAccsTransferable.length < 1 ? (
              <FormControl fullWidth>
                <Typography
                  variant="title"
                  component="h1"
                  style={{ marginBottom: "25px" }}
                >
                  No payment account available
                </Typography>
                <FormHelperText>
                  Your account may either not has any payment account yet, or
                  none of them has enough balance to make a transaction <br />
                  Please contact a staff for more details
                </FormHelperText>
              </FormControl>
            ) : (
              <div>
                <Typography
                  variant="title"
                  component="h1"
                  style={{ marginBottom: "25px" }}
                >
                  Transaction details
                </Typography>
                <div>
                  <FormControl fullWidth>
                    <InputLabel htmlFor="payAccId">
                      Payments accounts list
                    </InputLabel>

                    <Select
                      value={payAccId}
                      onChange={e => this.props.handleInputChange(e, payAccs)}
                      inputProps={{
                        name: "payAccId",
                        id: "payAccId"
                      }}
                      autoFocus
                    >
                      {payAccsTransferable.map((payAcc, index) => (
                        <MenuItem key={index} value={payAcc.id}>
                          {payAcc.accNumber}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Current balance: {currentBalance}
                    </FormHelperText>
                    {payAccId !== "" && currentBalance <= 10000 && (
                      <FormHelperText style={{ color: "red" }}>
                        Current balance is not enough for the extra fee
                      </FormHelperText>
                    )}
                  </FormControl>
                  <TextField
                    id="receiverPayAccNumber"
                    label="Account number of receiver *"
                    fullWidth
                    margin="normal"
                    onChange={this.props.handleInputChange}
                    name="receiverPayAccNumber"
                    value={receiverPayAccNumber}
                    disabled={currentBalance <= 10000}
                  />
                  {payAccs
                    .map(payAcc => payAcc.accNumber)
                    .includes(receiverPayAccNumber) && (
                    <FormHelperText style={{ color: "red" }}>
                      Cannot make this transaction type for your own payment
                      accounts
                    </FormHelperText>
                  )}
                  <TextField
                    id="transferAmount"
                    label="Amount *"
                    type="number"
                    fullWidth
                    margin="normal"
                    onChange={this.props.handleInputChange}
                    name="transferAmount"
                    value={transferAmount}
                    disabled={currentBalance <= 10000}
                  />
                  {transferAmount > currentBalance && (
                    <FormHelperText style={{ color: "red" }}>
                      Amount of the transaction must not be greater than current
                      balance
                    </FormHelperText>
                  )}
                  {payAccId &&
                    +feeType === 1 &&
                    ((10000 > +currentBalance - +transferAmount &&
                      currentBalance >= transferAmount) ||
                      currentBalance - transferAmount < 10000) && (
                      <FormHelperText style={{ color: "red" }}>
                        You may choose Receiver fee type as remaining balance
                        would not be enough for extra fee
                      </FormHelperText>
                    )}
                  <TextField
                    id="transferMsg"
                    label="Message *"
                    fullWidth
                    margin="normal"
                    onChange={this.props.handleInputChange}
                    name="transferMsg"
                    value={transferMsg}
                    disabled={currentBalance <= 10000}
                  />
                </div>
                <div>
                  <div style={{ textAlign: "left" }}>
                    <FormControl component="div">
                      <FormLabel component="legend">
                        Fee payment type (10.000)
                      </FormLabel>
                      <RadioGroup
                        aria-label="Fee payment type (-10.000)"
                        name="feeType"
                        value={feeType}
                        onChange={this.props.handleInputChange}
                      >
                        <FormControlLabel
                          value="1"
                          control={<Radio />}
                          label="Sender"
                          disabled={currentBalance <= 10000}
                        />
                        <FormControlLabel
                          value="2"
                          control={<Radio />}
                          label="Receiver"
                          disabled={currentBalance <= 10000}
                        />
                      </RadioGroup>
                    </FormControl>
                  </div>
                  <div>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() =>
                        this.props.openOTPDialog(
                          receiverPayAccNumber,
                          feeType,
                          +currentBalance,
                          +transferAmount
                        )
                      }
                      disabled={this.checkInvalidInputs()}
                    >
                      Transfer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Paper>
        </Grid>

        {/* dialog to confirm and input OTP */}
        <Dialog
          open={isDialogOTPOpen}
          onClose={this.props.closeOTPDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            <Typography variant="title" component="span">
              Confirm the transaction
              <br />
              {(!accNumber ||
                isNaN(currentBalance) ||
                !receiverName ||
                !receiverEmail ||
                !receiverPhone ||
                !receiverPayAccNumber) && (
                <FormHelperText style={{ color: "red" }}>
                  Something went wrong, please try again later
                </FormHelperText>
              )}
            </Typography>
          </DialogTitle>
          <DialogContent style={{ width: "480px" }}>
            <div>
              <FormControl fullWidth>
                <Typography variant="body2" component="p">
                  Payment account number
                </Typography>
                <Typography variant="subtitle1" component="span">
                  {accNumber}
                </Typography>
                {!isNaN(currentBalance) && (
                  <FormHelperText
                    style={{ marginTop: "0", marginBottom: "15px" }}
                  >
                    Current balance: {+currentBalance}
                  </FormHelperText>
                )}
              </FormControl>
              <div>
                <Typography variant="body2" component="p">
                  Receiver details
                </Typography>
                <Table style={{ width: "100%" }}>
                  <TableBody>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>{receiverName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>{receiverEmail}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Phone</TableCell>
                      <TableCell>{receiverPhone}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Payment account number</TableCell>
                      <TableCell>{receiverPayAccNumber}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            {isInContacts === false && (
              <div>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveContact}
                      onChange={e =>
                        this.props.handleInputChange(e, [], "saveContact")
                      }
                      value="true"
                    />
                  }
                  label="Save this receiver's account to your contact?"
                />
              </div>
            )}
            <div>
              <TextField
                id="OTP"
                label="OTP *"
                fullWidth
                margin="normal"
                onChange={this.props.handleInputChange}
                name="OTP"
                value={OTP}
                autoFocus
              />
              <FormHelperText style={{ color: OTP.length > 6 && "red" }}>
                OTP code is 6 characters long
              </FormHelperText>
              {OTP.length === 6 && OTP !== checkOTP && (
                <FormHelperText style={{ color: "red" }}>
                  OTP unmatched
                </FormHelperText>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.props.closeOTPDialog} color="secondary">
              cancel
            </Button>
            <Button
              onClick={() =>
                this.props.handleTransfer(
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
                )
              }
              color="primary"
              autoFocus
              disabled={OTP.length !== 6 || OTP !== checkOTP}
            >
              confirm
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

const mapStateToProps = state => ({ ...state.internalTransfer });

const mapDispatchToProps = dispatch => ({
  getPayAccsList: () => dispatch(internalTransferActions.getPayAccsList()),
  openOTPDialog: (
    receiverPayAccNumber,
    feeType,
    currentBalance,
    transferAmount
  ) =>
    dispatch(
      internalTransferActions.openOTPDialog(
        receiverPayAccNumber,
        feeType,
        currentBalance,
        transferAmount
      )
    ),
  closeOTPDialog: () => dispatch(internalTransferActions.closeOTPDialog()),
  handleTransfer: (
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
  ) =>
    dispatch(
      internalTransferActions.handleTransfer(
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
      )
    ),
  handleInputChange: (e, payAccs, _name) =>
    dispatch(internalTransferActions.handleInputChange(e, payAccs, _name)),
  closeMessage: () => dispatch(internalTransferActions.closeMessage())
});

export default MustBeCustomer(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(InternalTransfer)
);

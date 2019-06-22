import React, { Component } from 'react';
// import { v4 as uuid } from 'uuid';
import axios from 'axios/index';
// import Cookies from 'universal-cookie';
import AWS from 'aws-sdk/dist/aws-sdk-react-native';
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:bad230c1-7ae7-4053-8e1c-d487e79b8493'
});

const lexRunTime = new AWS.LexRuntime();
const lexUserId = 'bot-' + Date.now();

const credentials = {
  username: '',
  password: ''
};

const users = [
  {username: 'amy', password: '12345'},
  {username: 'nick', password: '12345'},
  {username: 'snowden', password: '12345'}
];

const checkIfValidUser = (user) => {
  let isValidUser = false;
  users.every(_user => {
    if (!isValidUser && _user.username === user.username && _user.password === user.password) {
      isValidUser = true;
      return false; // break out of loop if valid user
    }
    return true; // continue
  });
  return isValidUser;
};

const styles = {
  container: {
    flex: 1,
    width: 450,
    height: 600,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: 'grey',
    borderStyle: 'solid',
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  messages: {
    flex: 1,
    marginTop: 48,
    overflow: 'hidden',
    overflowY: 'scroll',
    height: 503
  },
  botMessages: {
    color: 'black',
    backgroundColor: '#EEEFFA',
    padding: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 20,
    marginBottom: 16,
    float: 'right',
    borderTopRightRadius: 20,
    lineHeight: '28px',
    maxWidth: '70%',
    width: 'auto',
    clear: 'both'
  },
  userMessages: {
    backgroundColor: '#40AD4D',
    color: 'white',
    padding: 10,
    marginBottom: 10,
    marginRight: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginLeft: 5,
    lineHeight: '28px',
    float: 'left',
    maxWidth: '60%',
    width: 'auto',
    clear: 'both'
  },
  textInput: {
    flex: 2,
    paddingLeft: 15,
    position: 'absolute',
    bottom: 8,
    width: '90%',
    left: 10,
    padding: 10
  },
  responseContainer : {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 0,
    padding: 15
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15
  }
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userInput: '',
      messages: [],
      inputEnabled: true,
      attempts: 0,
      loading: false
    }

    this.renderTextItem = this.renderTextItem.bind(this);
    this.userInput = React.createRef();
    this.messageEnd = React.createRef();
  }

  componentDidUpdate() {
    this.messageEnd.current.scrollIntoView({behavior: 'smooth'});
    this.userInput.current.focus();
  }

  // Sends Text to the lex runtime
  handleTextSubmit = (e) => {
    if (e.key === 'Enter') {
      this.setState({
        userInput: e.target.value
      });

      let inputText = e.target.value.trim();
      if (inputText !== '') {
          axios.post('/api/df_text_query').then(response => {
            if (response.data.visits === 1) {
              // new session created
              this.setState({attempts: 0});
            } else if (response.data.visits > 1) {
              // session already on
            }
            this.showRequest(inputText);
          });
      }
      this.userInput.current.value = '';
    }
  }

  // Populates screen with user inputted message
  showRequest(inputText) {
    // Add text input to messages in state
    let oldMessages = Object.assign([], this.state.messages);
    if (this.state.attempts === 1) {
      oldMessages.push({from: 'user', msg: `Username: ${inputText}`});
    } else if (this.state.attempts === 2) {
      oldMessages.push({from: 'user', msg: `Password: ${inputText}`});
    } else {
      oldMessages.push({from: 'user', msg: inputText});
    }

    this.setState({
        messages: oldMessages,
        userInput: '',
        inputEnabled: false
    });

    if (this.state.attempts === 0) {
      var obj = {
        message: 'Please provide username to login'
      };
      window.setTimeout(() => this.showResponse(obj), 100);
    } else if (this.state.attempts === 1) {
      credentials.username = inputText;
      var obj = {
        message: 'Please provide password'
      };
      window.setTimeout(() => this.showResponse(obj), 100);
    } else if (this.state.attempts === 2) {
      credentials.password = inputText;
      var obj = {
        message: ''
      };

      if (checkIfValidUser(credentials)) {
        obj.message = 'Login Success!!! Start your conversation';
      } else {
        obj.message = 'Sorry!!! Login Failed. Enter username.';
        this.setState({attempts: 0});
      }
      window.setTimeout(() => this.showResponse(obj), 100);
    } else {
      this.setState({loading: true});
      this.sendToLex(inputText);
    }
  }

  // Responsible for sending message to lex
  sendToLex(message) {
    let params = {
      botAlias: '$LATEST',
      botName: 'BookTrip', //'BudgetBot',
      inputText: message,
      userId: lexUserId
    }

    lexRunTime.postText(params, (err, data) => {
      if (err) {
          // TODO SHOW ERROR ON MESSAGES
      }
      if (data) {
          this.showResponse(data);
      }
    });
  }

  showResponse(lexResponse) {
    let lexMessage = lexResponse.message;
    let oldMessages = Object.assign([], this.state.messages)
    oldMessages.push({from: 'bot', msg: lexMessage})
    this.setState({
        messages: oldMessages,
        inputEnabled: true,
        attempts: this.state.attempts + 1,
        loading: false
    });
  }

  renderTextItem() {
    let style, responseStyle, href = '', str = '';
    return this.state.messages.map((item, idx) => {
      if (item.from === 'bot') {
        style = styles.botMessages;
        responseStyle = styles.responseContainer;
      } else {
        style = styles.userMessages;
        responseStyle = {};
      }

      if (item.msg.indexOf('https') > -1) {
        var pos = item.msg.indexOf('https');
        href = item.msg.substr(pos);
        str = item.msg.slice(0, pos);
      }

      return (
        <div style={responseStyle} key={idx}>
          {item.msg.indexOf('https') > -1 ? <div style={style}><span>{str}</span><a href={href}>Click here</a></div> : <span style={style}>{item.msg}</span>}
        </div>
      )
    });
  }

  render() {
    return (
      <div style={styles.container}>
        <div style={{height: 34, backgroundColor: 'yellow', padding: 5, color: 'green', fontSize: 22, position: 'fixed', width: 439, borderTopLeftRadius: 15, borderTopRightRadius: 15}}>
          <img style={{marginLeft: 10, height: 35, borderRadius: 20}} src='data:image/png;base64,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' />
          <span style={{verticalAlign: 'super', margin: '0 10px'}}>Reporting Bot</span>
        </div>
        <div style={styles.messages} id='style-1'>
          {this.renderTextItem()}
          {this.state.loading ? <div><img style={{height: 30, margin: 5, position: 'absolute', bottom: 45, left: 0, padding: 5}} src='https://support.signal.org/hc/article_attachments/360016877511/typing-animation-3x.gif' /></div>: ''}
          <div style={{float: 'left', clear: 'both', margin: 20}} ref={this.messageEnd}></div>
        </div>
        <div style={styles.inputContainer}>
          <input type='text'
                  ref={this.userInput}
                  style={styles.textInput}
                  readOnly={!this.state.inputEnabled}
                  placeholder={'Start a conversation'}
                  autoFocus={true}
                  onKeyPress={this.handleTextSubmit} />
        </div>
      </div>
    )
  }
}

export default App;

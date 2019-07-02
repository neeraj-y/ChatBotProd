import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import $ from 'jquery';
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
    right: 10,
    bottom: 10
  },
  messages: {
    flex: 1,
    marginTop: 55,
    overflow: 'hidden',
    overflowY: 'scroll',
    height: 488
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
    width: '94%',
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
      loading: false,
      slideUp: true,
      showChatIcon: true,
      showLogin: true,
      uname: '',
      pwd: '',
      isUserValid: true
    }

    this.renderTextItem = this.renderTextItem.bind(this);
    this.slideToggle = this.slideToggle.bind(this);
    this.showChatWindow = this.showChatWindow.bind(this);
    this.hideChatWindow = this.hideChatWindow.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.compareShow = React.createRef();
    this.userInput = React.createRef();
    this.messageEnd = React.createRef();
    this.slideBox = React.createRef();
  }

  componentDidUpdate() {
    if (!this.state.showChatIcon) {
      this.messageEnd.current.scrollIntoView({behavior: 'smooth'});
      this.userInput.current.focus();
    }
  }

  handleChange(e) {
    this.setState({
      [e.target.id]: e.target.value
    });
  }

  handleFormSubmit() {
    let credentials = {
      username: this.state.uname,
      password: this.state.pwd
    };

    if(checkIfValidUser(credentials)) {
      this.setState({
        showLogin: false
      });
    } else {
      this.setState({
        isUserValid: false,
        uname: '',
        pwd: ''
      })
    }
  }

  showChatWindow() {
    this.setState({
      showChatIcon: false
    });
  }

  hideChatWindow() {
    this.setState({
      showChatIcon: true,
      messages: [],
      attempts: 0
    });
  }

  slideToggle() {
    $(this.compareShow.current).slideToggle('slow');
    if (this.state.slideUp) {
      $(this.slideBox.current).animate({height: '72px'}, 750);
    } else {
      $(this.slideBox.current).animate({height: '600px'}, 500);
      this.messageEnd.current.scrollIntoView({behavior: 'smooth'});
    }

    this.setState({
      slideUp: !this.state.slideUp
    });
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
    let oldMessages = Object.assign([], this.state.messages);
    oldMessages.push({from: 'bot', msg: lexMessage});
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
      <React.Fragment>
        {this.state.showLogin ?
          <div className="container">
            <div className="row h-100">
              <div className="col-sm-6 offset-sm-3 text-center vertical-center">
                {this.state.isUserValid ? null : <p style={{color: 'red'}}>Login failed!!! Try again</p>}
                <div className="form-group">
                  <label htmlFor="uname">User name:</label>
                  <input autoComplete="off" value={this.state.uname} onChange={this.handleChange} type="uname" className="form-control" id="uname" placeholder="Enter user name" />
                </div>
                <div className="form-group">
                  <label htmlFor="pwd">Password:</label>
                  <input autoComplete="off" value={this.state.pwd} onChange={this.handleChange} type="password" className="form-control" id="pwd" placeholder="Enter password" />
                </div>
                <button onClick={this.handleFormSubmit} type="submit" className="btn btn-success justify-content-center">Login</button>
              </div>
            </div>
          </div> : <div>
            {this.state.showChatIcon ?
          <div className="chat-icon" onClick={this.showChatWindow}>
            <img style={{position: 'absolute', right: 20, top: '72vh', height: 130}} src="data:image/png;base64,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" />
            <span style={{position: 'absolute', right: 44, top: '92vh', fontWeight: 700, fontSize: 15, textTransform: 'uppercase'}}>Talk to us</span>
          </div> :
          <div style={styles.container} ref={this.slideBox}>
            <div style={{height: 50, backgroundColor: 'yellow', padding: 5, color: 'green', fontSize: 22, position: 'fixed', width: 447, borderTopLeftRadius: 15, borderTopRightRadius: 15}}>
              <img style={{marginLeft: 10, height: 35, borderRadius: 20}} src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANsAAADmCAMAAABruQABAAAAhFBMVEUAAAD+/v7////t7e3s7Oz5+fn39/f09PTr6+vz8/P29vbw8PB3d3fh4eHo6Ohvb29hYWHR0dHDw8M/Pz9GRkavr69qamqhoaF+fn6oqKi8vLycnJzX19eIiIhPT0+WlpZaWlq/v781NTWMjIzJyckrKysXFxcNDQ1dXV0eHh4lJSU5OTk5SbvsAAATpklEQVR4nO1d63azrBIOqDFATdM0NoeaQ9u0/fr2/u9vCyYqzKBgNE279vxiYXxkjDAHZpgRyYmKIKeI5q0ozFuCyk7ZF6pOLptMdhJ5OVT3MNnJ5eWik94aUDAqeQvH8qcASbZ4iCHlzTAu76mGdCtAl/AW9DWkgYD+Nm9UkgjDcDKWrWiSNwPVGcjOSLa47BSqU7YmRLaYbMWyRVTnzQGFIyEpyolw2YqJbFedsWzxqOyUlwk7X47GssVU580BRSP1PxO5uMRyKqLzk5frVVB8MOF5vRrLVvHBhDcHNKq+4dj6DfPqG64mg7pnXE2G8NaAyN/mrZyKsZx/DJnTOZJtTo9DZE7bgAIR9QPkOKLRWBJXpLfGRsuzE1yOaDhP5wmJLgVy7qxkQNiw4pbvgugrbogt3ShQSLPDSNJrmk/5C4DcR3Q12c23ozPNKP1TekmNtdHocC3eKvEwPsuMk3gISpnBy05SCZ9SM9XUdxQoEPNRndaUdgPyGlEwUsI8ZjmNlViXLaY6qxaXrRjr5EanBShaaLx9dgbyGtEobF9xJw0rLqbXQaDpSKeN6AjkNaKryG66MXh7Y39GL6Frg7dV/AO82TVTiESbhhR68OYO5DWigrdAIpHCByFbRHWqVuGDkK0oOCMRUd4zli1Bzgu0BQjyxrsBeY2I1GxTu7KHW4ITm0kJgMSzwdu2I5DXiMKryG4Gefszesn/efudvqCW+TaoL+i8KuWtuFiVZOdpVcpbp1VJeV7UqlTeM646AwxIsJjnOoS5Tm4JLzhwBuoyImf5Rv3kW6DeOTumz9un2e6fwdu/w/1+Pc8iFsdMdJVvbSMaRC+JGGfZ5vnucdRKj0/7TaK+vNvXueR3T477/9q5qtNhf5zwWPTOW492QCAYTdYHP77O9LraTCNjcbjUDsCspZphNLZaWKCTkmz73o2x8/+XJvlYehsRancHNitXvr/8FZlW7iT/CmLx/HoRYwXt1lP5N/Uwop58QQFjm0MPjBV0n8kv7zb0knwgy8u+RZO+UzruRS8pvknlDVRfgJqKxReg5qdCOnWW3kD1BZy9gaZk7oP2kzjoOKJz58kXxOOc1Cwcl61ItuKxfrnorN9D0o8BWJPcxdG404jO98QuMqDB+07n38NwltPXJhL+I+rHF5SvZtHdYJxJWjxwROe6hl5C6XFQziRtmbiCLwhopoQO+6cV9P4Q+evKJ4/zab9bNk+7y/KFiNJOUBvJ3OhUfUkfotqBltRxRAUXp/1uxVtXS/DFa4D/3r8fF4v3f1+f/sw9Kb3ExTbtxRdE6d5pWB+H1XKeZclEFOPIF75pkiTZPN3fA6POSt+JuKJeQletA/qc7ecJK76KcjKcwrDUS+Zsmr08P325vKIsvhZvAZ21DGaWJiS3qNuBJOebbbsRmznxFgY2X5CrpzMQh8Zx3M+9Ji4dMz7d3LVoN4nLfDN9QUHxkZ3tBqbUsbDsLKVJueLSxn/tv5f8l4ETUE1Qytd7XDWuMw/CAUj3BLTKNyApm+baaloob05AusjNLcBg0/TWEjG4XkJNX2NF+6mSjt3dHDGdbq3o72EwNG9z27PfpvHlLpx8JlmlyyH25a1mB0jR1+J5ERPLg+8ZC3yAGtT3xKbLvXkCFfab0mOUYaT0GFZ1FoaR0sZki+CK1scLYX5AVdBg0VkPGqTJAn3K6Mh9gHBfEIh8LlfQN/SZTxPWHIMBgFCxVMZg2Ez5j6kPkJ/spg/oI1NeDOlyp9KJt5y5DPXA3POh9BJK0QcmNOybt3w9Cp6wZ81Fpz2qtsgwhi//76znELMTUMCx7/+VhR6xatyZIjMCRtK3iNwR/IimyPPWxB2gITaUlH9EseLye+Q9TkR7OI8J5BwbaobcSCr+HbfYUGfZTTL4oH9CBH1vLdWAyBI+chkNoJdQZHJPB9g2qwFxDlWwT1+dyyViHdFIjkPH0AfxDs445go0Ylb9oPDanjsRsb2lp0yDFkVDB8I1FgsQg+vXq7zLCcjVFxSE4CHvIugnvMAaFySBoG6eOQI5+4IEXJCP4hq5RhTsL9/RnvUSfjAf8cSbhtQfbwl4qYT2yxt8QiL64i1s5A2uz0cbb2GA7b+VSGBIhdbNgGJ+R85rsZlK2QhkDIlqKygOBBT0FcIbAhQYtqk1KgDoJA+kXDGAXtIEZFllmoBMOfAlGvSSGpCrL8j0QS3i5lDc7ltLEAgsY5noUy8B020trpdHNYYP75M3MN2mwfV4owdzrrM+fUGme2bBm8L6L/MFQSBTZX6N3XxBksFiT2ssW+ieFo9Mg/uZnvI+jXvagKrNsaqzFYiB/dlo7AJ0km9h49I9BlrdA4ViSSbZhJy1yQCbC0fen015XFN+z0BATU+iBiDiJbuhiMm/CUMLYHwvN9S+tgnropdwGi2lf/BzlUElgJufzTHqTS+JTAP4i5pIvFqoU9qBN/JQShm5CWzwZu4TpG68uajvkblMHqjhedH0lrXdDsA8BxKI1dX9N3NEzDRR98QGFNbtAJdYG2L66O+IcY/ub8jG7UE7VacE0i2ol0hHJ+a7vSM2oDoXZ1+QkiZKwyFajJRy4RDTLt3nr+hk5Rbv76BdXvAAByrM5eIfJedO+Y/q+17/RKiNCDiFZgQHqkYkO51kNzHF25LpktJcRzPhJbspMe5/EdqIgIH6H+lNLyGmprw2eDPfa37dizfThbZlOm+mgNs58pa3J7oLR8qpoPyU5OBMEyoVuufFdDi/MRyodOHogazg3dwzbURgH+KR4EDE8AU1532qTshbpAUTA972UUMwcS2B9BSVTEze7iLtHmL+b48EB4q08GYnGUBM+bLRV1zgTNn4pZoIc+zP+oiEOd8W1EkGuMhuhDc9Xtk0gQIKda4m2S2M+zN9RBhvfeklbbyFXP9oZ9RTL4l14fxIh+ANV3Fx3mqaqdD/uAn11ZUnWuhMRvUR4by56cpFGlJhUWC5SRhvJK7nM8X1sLw5tQGpxKhTAqk4J0ZJIFaXAmtqjIhB3mxA9QwrJ18QcKOlAliCyTms7j2LOviCSHYO6vrcxGBEiAxwsU1dZDfCG3QFiHT2MfqYbZocow2uAME2T1+jz0NKBBgRLt/60UuceAsE50X4YCfe8lkVF5Fd0PFyXd4Y5K26p/cE/668ufiCAG/PrM1l6usLagYy15KG+Vb3vRYrmXwBp1UpgPnxYJ18o0358XYgz0T7MxDw2C+oC1CrfCOYfHuiQJq07geQFl9QAxAz7UcP+eatl3wAf8mgZ/1xc0dgSJ1LhthekTfgw3PkrZMdIN011qOnuqScNwIJ4LFfUAegsM1+i1H7bTQSeDJoC5DZyTCzCwBRENhY2G9tQFgMRv2wA2UuI6El29jh+EEAZNrdbucYwvAgYHd3P8cQC5s5klaRC4G6yG7O4MOH1Ety+hT0KrwJjmRGuPJWaQFhaAkxw3gbvcup7HT8YOdYtVgGSMPIoGY7oAIqYgxbzgZE1hL1WdLIfk8vpxWOaYZmJD0SFyCn2FAoAwp6ytT7O4UXKCClXimg4ttQQOqDUS9VqUqq87RiyH9HqUoQSAgqLOkCTr6gZtmd28PqdnuWyiFN4ohPJalldyJbalmOZWuiOtVltfwL2QqqTtUKZEsFY+lAD2vrYxc0jnlhEnXRS3JBK5LNfvv032G3c0nkuiZ97Ha7w2y1fJnK813sekkpHuqh7zlnm6eBErf7pdky4cLQlevnGBIjZWFMj20ZbrdEizQXOOXJy9VxzKgvaOOcLnkj9PEcslZfkOTt4UoJwL3SR8rNiBegl0Rgr+230C6htJG3+OHWlkQPejF50+YbH+K4juvRnuq+IM0StOck/g56iq17VL+dNRlozFG9BM1/+W20JRhvAk9u+22UIr6gYOqhYllyJgcjh9PnSppW8+2cRQEjkhtok/j8+lJ6SpA0JystuFHTwpZuaaE05tP1df68x2cB998aacl0XxClPn+73KMKcr375W3X78FcOr3vVmkiz6Lz42000fUS29E/7/f7dLOZmz6LInZGzdTpNEmUdzCRJGRLHlGSTGVLGJ0T2QpUZ3VPKFsTo1P6P6m0T9A9qtd5TuuVRfF9Zrov6ID9aJtQlaHUsCesew4CpeCo3Zq46lQttcmi3Bak6qy5IAIEqHQqgf23wh3AMjQn+0vUa1pEMCUln8LTc/0JuJcfDViKAgJF5le1oMXl3GbDuJsXPqpCBmCHGLxEgWtc0BB5wnWgxrggZDbdqcsn2R3BNe/BJ3YG337pbR+nMXZGIAKC1vUScDWlv4W3EIbYqxyvsy8IrLEz9Smd9w+a44J6LkWBAFnigs5AHJwWk4rSF4Rk85D6DhDkjQxYigICcbiW1IFisPf4ppCUbcrMpeSbe8cF9XcELQLUFhdkaoD3lS8oNv/Ubdy8j4PFzgy1R+UQXwK+u0Oll8Sm/0flUP8i3szrOzfe0H1TLV6551IUCNAlvHGMt1o8CoxXZsOVokCAEN40IBtvataZvKX6RMf1EmvKee/FMRAZoAHB63HlC4K8Ea+Y3h+V3QFynVd6yf95+3W8dZ9vYdMRD70Wx+g639SeFVgnY62CBLJODliKAgJZ18nTPTcj3zyLY7Tk41wku/+yXvKbeVOqNuBN/C47APKm7ABlv4F1kmhxe53tt27FMQDQGLffynvA9R1R9hu1yzdnu1tWkEDt7i6lKPzsbgWEyrfwb8vuv8yb5ML2TYanChKWbzKsV5A4f0ph1+IYDUBW/+TpHoS38FzTAl9Lqqx2fC2xJqN3K47RAIT4lTUgcH1HypoWLTIAk2+dZIBbKYr+ZMBflt1/njck795dVw770pWtQF11ZWXjmKGzaaydbQNtnBhWkDBOznEujuEAZLNxzkCNviDTdzl1sU2tLpxezzG82BcUmLfqIvfHZbdZHGTnoZeM9d3HF5M385tcX5k387uaefAmRD1M4W5s8mbuF6xac/t6O8dQdoK9mHui82bOt0PNFySCSbVzehcLY5pEJvZrowvH1/faCgRy+96IBgQS5N6UHnfOo6J0XUSFfh8pKEURgYNJM4G7OXyKYwAZYAOikfn450iXAeYmVXEOVhn3mqs9x+V+nakDqIzJAMMYVrz9+MF+ZLfkDUSsziMDSN/znkWV7D5NBsFYcUAgHJIJPkqueNafeZpQLqPGBhCvh35+TpnJW9OQQLrAjF+Jt/x/A0k5jxwA1aJIvjLhdY4hDBt9pnb1vUPuuhUImeyjNwGB4uNpqd+GwqumBUPihlL9DGfhBKSUKOMe9KjpEgiLjUkIAkRost4/bzgtH+5Y0wIeQZy/vVg4xmDUgGxatAUIqoMjFc2FApULhl9NC4Edd7944NV6daFewhGgIKJTLC8o7fl8ZYbG8x02RSnr3IAvMuWisqU6iyrdvOxUpn5E4T0xAZ2cT+d4jonz2dHlRG8OMUPO/D59ILO7u3tJd5KqlnvnPd45s0WrLmnfNS2IV2DsgPRxDkBsJfeaFj7x0EPSRjQ7lcp/1KOmhUOtvmvQ/RA1LSJxC3lxn1FDEA7Km1MpCuQs+utT5lEcw7mmRd4JtoKuTxvqURzDr77pTzO35sPVN/1h5tbcx/HiWwP0R5k7cgfl7YL6psJWd25wep361zfVeGsvRSGA0+k6tKXUMqJyoe9a06K+ykwPV+dskX+P3ge0+dc3lX/u8brcLY6nkuHWEfVTA1QhCZ6trnaSxF0GT/IYtKZ8Lh6z/a5DNW4/WmxfBOZVHKK+qfF1k+k8XS+XqaSlJNVar839g/9S+bPlcl38El7f1C+fgDYPMolOoB7nHmtaYJtjcXEaiHor0lpSLWVaEeAs3RJe7FDLyxEswLElEQSK1cHfFxTHcKpp4XH8YAFk8raKNSDA24pZgC4ZUce664gWoPmCMN5qQC68XT6iv82bkx0QYlq37nnRtnIBb0wHwnhDgS4ZkVtNC2spCnBP0RmBtYJqQJF5KMWW4kCXjcippoWlFAXRKkiEFZCAY9eAgEq6rYd/hX2NqKvsbtx+YQhvdSCEtwE2hDrrJb+Dt7C9poWlFIXueQkrIPybrIAsvEGgy0bkVNPCUooish1liqwVGhBy3f1wVfcR+fmCLpYBk75kgMOIPH1BnWU3/zt6CcypZnWgyDwE7O0avF2sKxdAwBv2mRaHZ7Jc0w9fwPlma+FxeLifrtxW08JaiqKWGBXUgEANJ0mLu+3+7W31hO11HRkOdNGI3GpaeIcZM0+HA+mvUKpvTQvvsBAQJNxMB/p79JIQBDw20+Y38RYwrzOSooF4u8gXZJ0m8Oj4BnpuALpkRE41LTqUoqDfzqx9TsQwxTGcalp0KUXhvvW/YY1AnUc0kF6St6jrlsgbaQS6OZ1LdsKTblB6Umd+D8PbIHaABArHlsPINVoNVxzDraZFt1IUEVKwwaQlcQHqOCKnmhbdSlHk73KKHf5f0S6LnYA6jmgg2X3eHmcbuyz4fjlFejsA3ZJeUm0hx3P8aPTZkVIfoE681dT3sLdSFBWQLH02N05TfL9Lp95A/iNyqmlx4WmF+apCWbZZP+f22365yRg5H5DoCeQ5ItfYUA8ZgAIV5StkunyxWdgZyH1EA8ruHwf627xV4qHH0PebAMJrWqjjiYmRnRBXxSLUPWYFCXJzQIP4gm4EaGjZ/YNAg+slN8Rbnyl5Pw1Uj8UufBAIUmBPpTwd+VwO6ZaAyP8Ai96gAtyGCLoAAAAASUVORK5CYII=' />
              <span style={{verticalAlign: 'super', margin: '0 10px'}}>Reporting Bot</span>
              <div style={{position: 'relative'}} onClick={this.slideToggle}>{this.state.slideUp ? <img style={{position: 'absolute', height: 26, borderRadius: 15, top: -37, right: 37, cursor: 'pointer'}} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvliYF33OeQ4SzJXjrRHUfKP4se4j0ZqSgiT_X02zLnLJGsetXxA" />
               :<img style={{position: 'absolute', height: 26, borderRadius: 15, top: -37, right: 37, cursor: 'pointer'}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAkFBMVEX///8AAADz8/P09PT+/v79/f319fX29vb6+vr8/Pz4+Pj39/f7+/sEBAT5+fk5OTl2dnaJiYmVlZVWVlZHR0fHx8fk5OQZGRns7OzZ2dng4OBsbGwfHx/AwMDR0dGrq6uhoaFSUlJwcHA/Pz+amppISEheXl4oKCiMjIzCwsIRERGAgIC0tLQyMjIlJSWwsLCdTCmGAAAZp0lEQVR4nNVda2OiPNMOyBlEpYuiVqutte1q7/3//+4VyGFyggDp7vPyodp2wswVkswkcyUg1F6eJ31Bui8/L2v3ds0VZ+2vXhzTL+1//Ix+8XWykohKFmlkicgQ2SFmtleUtH/28rz9s59HWC7J2i9ZEo+QzXtlye0QEaGyMZEdp5rct7mSsP2zl4btn/0wbW+RhTnWH0aSLNYSJkiUzYgstojcLiayEbsdlpVUq2Ql1bKZmSDb3DWZtX/2glmrJZ4FbcnITXEBF98inOGSsxk2xA3xzYls6mKLAizrE9mMySa8LFXtE9WZQvUIM5s2G2HcD6P7S7qirBsgXpYBdIcA1MkmRFZWPRNVy2Y2jTfGLZdVo2sVoMeMDrQAtZUhAwyYar2ZWHWYeOQ51oa4EsBQKBkwgKSJUqNHPMGQARRUZ5JqVrdMFmkAsrptboe9Bnwqw5/gKICKJioD1DbRfjOpaqGkQeP+f9IHiSzW0t9EJ/VBRPwVIp9x4omqDfqgbKa2D/IA9UZP64NB858sqMr7y6W4LffX8/vTdb+8FZfT/VgFj1tmuLBRHzQxU6zbtmqmuAk9QORX6+Nlef12dNf3dVmU6+ZJDWuixmb69YeX/ogfrMrb+QMjmeOPufilxXlelTtc21MBCk3Uj/w6yAut9sHwUTg8LJ8ZAgkX+EKFnpeHsFagBziiD8Zp4/Hz3vF3SB+M3e3lHT44E4D4y3txnBnUbZ+ZdFCOg/o/Hp6HWHITx9uiH5cGYH0tVlv1ExzlzRoR7PGthGpVQQcVyXoDgPg/38Xa8wXVRhGl2ESJmaSkrmpMm2j89SR3vREA6+vpK+brdkioJppJfpvkJnxUXTaO3PVGAWw+N5fqoWB4qAZkQwhwWh8M0e6m7ldq72BWB/PbFgmqx5jZVIk/m+Imoni3VxvtSLjkS/+QH9d+jUaGatTMxuP74RQ34W33Olzky/PivDzdD+V2u6uCfFY9Ip2vw/20PC+o09SNuA+M6YhQjTbRLKoniHk6YRRdLzsf3K/Xy3FbIVwowNFcigujanu8vP7iHqmIdImjnXE9Ka01xtHwZ09lC7G1AYBPRVl5dfiNb6eY0Tc17bnl57mjrRZY9XAz86DW6JHVt64+KDRRouWw0QF8Xh3EJQv9jN5PH38oV1ycx42rB4S6Ihmdm6CqtVXT0wfXTyCkhgDfLjsURYIWgxn9tnhTAXxc152vM1MO1aTFv36A6ib6AgdCVv0fxa5ueGNm9I/PXfHhKO97GmsmBTjUTax/KQ25lh7qWlVDvTN6r7wqm/6v9cihQlM1XY27ln1R1fT80+WNHrWqFvlVMVf17RcUmLsJ5s1aLQNDNXev6CuLE/YKFlbV0peFIgS8Vv1migDj+h9xOLBxHzcywI+7S3IjHQDNF37jl/8EgI/PzVEws7eJRrUr9JN8GMCTPNr9/uNH4lMZ1kTF+WCY+39+8wDn7YBj4gdpo2w8fkayNWahWrKXARZ1FmZM8qVnfKvjCSEE2Lup0Ac73ERaL+ZRj2/4BKuFBHBZwdyE1YXf9avDA3zMj9d9ZsorK0MAbh0R4MfxB5MvYXb8kDRuW9nePqgB2NVEE3SQ1BVKo20mXwqpMx76vZkeYFeoljRjDAD4iM923QCtJF92OJZjqk/erDdUG9FEk3YiAQF+eoMBjki+eO5K7IwF0popAvRai4wAfooAj1i2rw/2h2rdyZcEHaW6NQXYZEdpmr+7D974anSemsdivQ+qjY6fhCjx1hmqUYANV8NPoj4tKoCfqAegAWFhSG7ik3XG5uOGAm2oRlWnDeWEUG2GNFHH+TIFOMhN6AHm0YED6DgrXzMvB3UbNJkncXnZYJBx5rs+gKNCte7ky24OAZLhxiTLh3/rCtV4N+G8VX0AJ4Rq+lW16o2fUZ1QN52HA9ithXf0zlM4AKDNHH1C8watLQfzJzgkVHOeEJH9kVCtY+E3Sa98Z9zmvVQCCaCiiVY8wD3SGP0XeDI+2nOjjbNjZqoBCrw2ZZiecLMJZ9kL8Gd5Mku4vOEskh6AUctr6wzT9wOf4E/zZF655Y096mqiAq/NYEZv0AcVTdQqTwZlTwBgPaB28JUCntemnIccVQD/UqiGuD5IWzy6cqNNmesJWaGG1wa0uBvODxq7ibGhmg4gJ5u/wdFmU2kBqnltfDXuuUimIrJWQzUjvhLXk6o5DMP3UwC+cLGonVCtw00YJ192zPPP66ViE4DKtYD12GDbrpuQky8sDG+sW499gugXnHUaT5d+nE5Zx6LcXOc90wIUeG0d2SU8jP6FGb1h8uUJtq8T4gFSMwmvTZMfhACdn5nRu6Nz9DFn3ZqTZc0Z89o063FP8BbHHoA/TWmWky8lHG2uSoAZz2uTUthwRP40BjhuRs+rNkq+RNwK3EEFkOO1ye1kA1LYbz3LhqNm9JN4Mrmbe29gtNlQWdlMsaSKZWG+8GtvRo96ky87GFEWmRlAxpOBAHuW7v+im+CfQwHdtW5lRQPQg0SgD/SDyZcxTZTK/gd60g3xZmLVza++1ESjLQBYj6O23ARZqJ9Ep6RmZiU0c60yM255bdJyVQy5akt7biJyj/fjbGSoplhVQ0tm5iMCl83EvDayz4/RKXcA4KOBW+qDadyQUDcn39oGnYqZ+RgPU1F1y2vLIqkkgnTKwlqo5t9wo7ohLDulD7aqC8jVQKKZHK8NMn53AODvrvngoD6YljRCKtVGD+HJkLr9TZdtyPQOmIlvJ5eEjN8/8m6WkTN60DL2aGSoJq+qvQC3dlObyWsRG/eHb8KyMHETMYlBHj8eMdKQnS9d+1fcDzBmVGYA0QX03ntkLVSLFvS+i8gbF6rJi07oDrrUxQxgvAFULsno8aFajRDfd5HqR1EjNwEmvD6rOGeTz0QzvdYiruQXGJ5Omb1Q7YGQVlxFhvPhoZq0JgMm6s5BpLXyvDZcks0LyeqanVCtRuiQpqEHaN4Hsep0zobTs2Amz2sjW3sYKxCvzVia0ecLOqwvIg3AITwZml1iCXAcf1Mzk7TJcmd8yQI4GB1fdMyMHrkLakiL0GCTskEC1A8r5i+aaRAzs9kcQLLctOQ3q5GrOUCD2UTFdrU1CK3tpW6X+duJ1DdnJtl0zJU8Ag9atkbbSb7MkgWt6RqhlT7YNucSOPBtLJoplIxvDOC3h2z1wdqQxh+2hjwQTgrVhNm/98GG01XUDTB0wQbJQglwdPIFevxsMPO6A2A72SeDWCDICiXDLQNYB7I2V9Wgxw9mNpooVU0m7PX9t7ys11rPYqALA/jLMk+G8/hkOFcANHYTYOEXbEUpODMxrw2UfGedVhXkGYVqmkUnhccfHapxspnrXyhA5x2ambS8toyVDMGotBu380W7qpaK/tBOH2xU75i/cEJmZnN6C+W1NSUPDOAz6prRj+DJiP7QgptoVdeyz2zp9JDR58Dx2tqSSzjs2k2+zNwFbUoNwkmhmli3K7Z0+poJZnIlnzvC9InJlzBf0KZUIxw1o9c2npIZ/ox4M7mSMOq2nnyJGPXogdCOm2Cqqb/A0bcaYF0TRPJJADg9+dL6Q+zxc7sA8/zMHHmJdE0UoRuriYIHKLuJwTyZxh9ij+/OJodqHEAXZ5IaBStgJuG14ZI+rQgcdVtNvnAeP9LJjj16qmT+4gwiSp7XFlRg3apSA5zAk4EePyCyk9wEHCoq5hC/E5pLbHltOYlO0jUD+MuzTqcMJY9vw00QMz1AHNmSE3c4Xls9kzxSgM6r9Rx9Jnn8iaGaMNi/Mn9RIiwLeW1NyQt70hfrCVDJ41s+HY2uvswfxnOyRIvXRDSkIo6+9Z0vEe/xLYRqEGD05dAmsuTMhHCvgEEdWKdT8h7flpsgZsKZ7RWaCUtm3xTgc5WLWsY0UW7pHnr8KLURqsGeFM+e6SDynbGhwoPVGLCYbYF4LTZ2vvAe30okw/UksLofekR1y2sLccmK9dUzMXr0jF5OgHIef0jypb+JNrJn1seqAKuOudNbEMj7Lzktdngy0OOnvNET+2AruwTuAh/KmHG8tiy5E4Bz5yQAtMGTkda8LT1BInti04Z7+x+e15a52QsF2IhY5snkose35Cao7B+H1uALlm15bYgafaEAayLcMDdBlkIIr5Pk8bIZNiQPArDmXddHgG2lshGRJVtcBh1km99ZJ7twsqxkwUKaclioliIvely5WyX1Z5RWbt58CSu3+YzcCiNs/WHwmCBikZSIBJWbEdmsSYsNOuc1KSlAvJadigDr2SEZzrfREJ6MX+7fFv3XnA7ncwPpt/2XPwDgDC8LNwpu8hNsGswSROfBgOQLzXX0X4xoZ3KtWhsMN+ismYKlwGsjY/WeGbCLWckWoL4PRhfBesa8lb+ISLtlT91PkB8qKna7PVLz2q5suMXZbRM3Ebgbc6N1SDUim9kAxlnFbnclZ/fyvDZ0JmodJ8BVY0IEOg4yepjs0YCvRMycsaDzjD1EzvHa8uyd3Tzva6LAD95/DqBzz83pPKlDn9A7NpM7vSV30RPTMhuQfDn+HEAWfvXniDyQzn/CZvK8tgSmw6sBoVqw+TGAmwFHT4VrdperGiDcLVoNSb6cSPOwDRAvR3TTeYR1tOYuezXANi3T3n2dDpjR++b+cJhDXOmeoCqiJP6wVrBUA3zENLQaj+mQVTVkHNPg+xvGNDqA6ohyy9rBjQFsl2pxSZDvxzc3ny55NBbNAhxoZo/4kgSlaf13OAPGIjMQtwLZx5XQfb+mfKWSNcECEYBZy2vDJS9sjn8gz954Vc2TZxMz7IfS1pBMznJn0mwiJCNjIKruXZ8+sD5Q5Bhg3vLaCJWGjBgPubsO4ISdLzKvbeJ7P4Qc0Z01wRP2+CnPa2NzfF1AOGnnizzHt/XeDyx7Yk0Qz/FDgdfmgfBLucdi2s4XPa/NNPnCA3SFsRCBbT5Hvm7xbxy/+2x/k3KQ87w226+mic+sCVYywEZLQAE6C2R9kzLieW1Tm6gUUXosLdJMHBQA+TXv0GYf7OC1TeyDFGDiPlOA35kaIDdBxOehD0u+dHPVIK9tNhuxqtbN+gSkoSsMuFqLsBbSVx3SV014MsY7X1S8Nkt9sJYFJ3gsmZn4rWRYS0b2jUrrcVY2KSt4bbaaaK36wkKai09U49NbSLNLwXrcqyHAAZuUZV7bOICim8CyryyqLlNsJua1kTDJRWsKsM7j2+yDSMVrs9hEcR6fDCIkkOTeSlaPv8k38xeubyVUY8kXKcttJVSjsoDO9RHwZpKStZYzC17L1JqbaCsjFLLcdkI1KluKqUERYKtlxZ70p68DOHaTMp/lHhmq6ZaO6LaSx/1XSoC+uiJMeDKmO1+4LHdisw8+VEu8NlUTRexkm1oOGz3BTQgJUD7LbSdUI6pnCTG8jUqpma3HT2njRs9MruwGOHyTMufxzdNnRkkwv2SGP8MBvOG1sbeSzdqopq3plS03QUZcBa9tXKimmhOsmOFLAJB7K1lT8sBCn+dpbkLmyQRaXpuF8wyemeEHRM1ss9yZB7SEYNlyG3Y0UdNQjQGMFLy2yaEawg0NHgIShLxqyGt7XO/MX+ADlwcC1PJkJI9vI1QjqkFQ+h6JQ0Vbkjx7wH/7JQKcdp5MkvEe32ITReiNNb0iErwZXzUe2ZxXy+94gCZ9sItOqea1WTn2ZgcW09t5HzNT0DKbgbWAQglw9HkynMfXnwg0jPXZqoZ71yLeTE8qCYbdb0+x82X8WRYaXlsfTwaEajqA3gfrWyuiGo8vLa8NPnuw+u+U0eRQrTVa5rXpjB7FvCbU0hrnllPN89pwyW/Waa++jWPHyKpaB69tpJsg2SXydqGH3d+cmVn7VrKc1wLatEMPu5zQB/W8tqmhGjk/ec0ANmMHMxOf3iKUhGdgFa2WKW6CySp4bTaaaJh9MoD1MwE9iXAw+JLemRSYO/N07IxeplPOAn7N29rRU+5vBvBJZaZY0v9i/sJ5GRuqyXTKLOPWvEe6CRiqtarRCwPofCl6kggwac42oY4rDk0GGSNKM396i4VQrVXts4pzNr482KtKgiDPecl7+6Dpzhe45p3oz/UZujkA0nkuSALotRbxi07gmF7nvyHJF20fbIz22MH/bxaPvfmPAZxXgQhQfCsZ1nIDR9n9aeSsvPB5T/3hXhzAR7mJRvUfBtC5xaLqiOO1UYA5PHHvN5rqJuiqGg09CBHCJFTr26DzGwTdW7J/hjKvOV4bMFo4r83OsWMo8PGJo+S8tul9UDyvTaxb4a1koGoAGdVx1vq36Q7dpHxqzty76ACazuiZasC4pBlBYCZWrSq5ByVfM6nk6D28s+O9NOCqmbiJxiqwx4K81EA2UwWwOSWZ9prjYIAdRx6RXm+jidY5Q2bmuhugSA1hydJ5c37pyFDNavJFNpPOCx184J7pE0ReCle/6wDcxrFjtmb0VHUBALbzINlMr/2znHyhu7+bj51n78ijPoDGfZCdrk+nQUA15LXRt5Lxq2obMJy+uYmgxeYmZTSqDyIfvFPP2XAAqSzPaxOa3QEOxCsJoM1NyqM2yaEVANjEEDJAzGuLlQAB96S+g/gWV6ublAeHavVVQoBXJcBQ/VYyeqAEG2xqpLG9PmjjdDTkQoBO5wufBYDMaP8EAD5mz/moUO1n+iAiGVEHT9QVg0zQBzCo328BZoqfkc3zZKaEanU6aQUB/upkfWqMbrTw7yg5ENnhTdRG8oUDeIcAH23UvIkK7eQF7BmgeYzhoZrlJupx07u6jXZElC2vTftWMrDWWhPtq/8JN+El6zkEuO+a1WFemzb5ElQbBvDh+JPk34dqXlq9QYAb19dHlPxbyZTJF/4trk8p4VNZ3aRskHxhRofkLYjYqCPSN9GQfyuZOvlyAgDJiab/MFTzwowHeJIBsrrVvZWMn9HvudHmlQf4U31Q2+zCfM8B3KsACkOFAFA+KOCbG7iWCP27UO0BcMkBXLhB76QHa9EnX+DZSvX1mgU2pksjmyj/BJ11agiwO/myhfekJ7n9/VDNS4VBxtnmuj4oNNG+t9cd4GjzGG5y9JNuQhuqJZUA8J5p+ytlRTWzi7QHoLSH8q36F6Favn7jAV4yqlpLTMZvJetNvnifDnfz+S7660002855gEXcvz4tvpVMm3yZYYKqFIb/vRm9EGzX7+XuX/zj30rWk3y5QYBzfCD935vR5ysB4C0Wl44Us7rGOsJr602+3ADAJqEc2wrVTGb0ZxFgKgPUTXr43/RhOr/yU18lmRP/+Iy+FFWvYlpfvQsPBGBv8iXwC17LQ483GOAQngxdNpTqtvB1TVSe1bW/Ge188chL5Jm2t51FgNqF3zcR4EUaRfVN1OO09CZfDhAgzi7q3wFqp4nSl/h1OnodwMbj+2FvH1Qd747VfeCDJn8o+XL8kABuJYD6HFHG8dpMki/5bsEDfHwsK0OARqEap7pasvQZmU2spVi0g3nd8tqiQTn6hHvX+pzkpqRz8W2EaoUjAdy7aW+oxkJm7q1k5jyZk9QZnd8vMyQ+lWl98KH6DyQh0Bm9NB/syhFBXtsQnky5ETvjozve/W6Ag0K1APl3wJOhi06KNRmDxT8NwI7kS17teYAtV+0lRaEVN5Fk7gugctEve1e16KRf/Ot+gj0r2y8SwLqtfmpfDzUk+YLWn78dBcAXpFo27F2f1gDsTb6s3x1HAFhf19LjZIf3Qe/r6jgKgL/WMAw2pxJ4rZYRPJnspDTE+S62eFF1TPJlV1D/x9/3pasnqQBi1SKvbUh+EK2vCoD19XbZaQDq3UStaHeh8Zlw32tnfrCjifJvJRvOkzlsJH+FP59XJbmtSRNFeVKunuXbOM39NwfUGzKrzeTfSjYqR89eeSY/ynNRVh4Ch9rLbqJ5yF5Vfp5JYUXf5lkWg+g87ektsVByCE8mzKqbGiD+/PVafG1n+DG1ZTzSKVDsubvj5fUXaJkywJuGJ2PgJqiZYsmBCdD13lG1VfAQnhfn5enPvdyuq2qWVuv1else7qflefFMW6IG4F5H5RqSxuRLjuHJ7Mj4LgPkkKqvjvParjLbcISZYtWMSICmaMe31a5D5vorg6xY3jC+KcxrLcDhOfrqsgHGawF24eJkN5eKLMUM3OYomOm1f7bBk8kPZysA6x9PXz4KTBceOpsoz2ubxpOZRagqvtUwzAE6dVTEb+2Zwvrk30pmhSezXdH9W6MALlb89rphzGuxiaYJz2uzwZOJo2BbvDvgMgLYfr4XR2EHqBxsD2K7CLw2izyZ8PD6bA6wuZ6XhyDC95+yj5MzE+RIbfNkHqFgVa7O3/KjVAD8OK8aenuobTyTmNft9UOU5mRbXpZXgFO4vq/LS7kVDswZuZdad7YWKWmVTsni1gZ6Flbl/eVS3Jb76/n96bpf3oridD9W9YYPv5+iM21zgFjyR3gyHnlpDcpIch0nLc1ijAneTMtr+3E6ZUez61ufNuqDZDc8/1ayf8iTGXM6mkEf9Hlemx2Ak96eNPLIDa2Z4lvJbLiJMTtfbO2lls3U8domABxFpxx5OppGtY40ZBvgAJ6MwSg6KeBqS5IthjFJfERkgE8CEsUGZEUplGTJal1A+GeY+uYT2YzI5kQ2VcgiLEv2skqqQ1m1bKagui2Z4AP6/RTrz1JcIEoJ3SPx+2VjIoK1ENmYyZLbMVnhdrGsOjVWjRLRzPa3jJwVFeF7+hEuEJMvGT65x4tE2ZjJYpEMZyQ7ZOntiGrPQPUoM332E3zxfE/6IogMkVWJeANuN0RWMtP7P5zhcwIN7wo4AAAAAElFTkSuQmCC" />
             }</div>
              <img onClick={this.hideChatWindow} style={{height: 26, float: 'right', marginTop: -37, borderRadius: 15, cursor: 'pointer'}} src="https://www.seekpng.com/png/detail/52-522348_close-button-png-white-download-emblem.png" />
            </div>
            <div ref={this.compareShow}>
              <div style={styles.messages} id='style-1'>
                {this.renderTextItem()}
                {this.state.loading ? <div><img style={{height: 40, margin: 5, position: 'absolute', bottom: 50, left: 0, padding: 5}} src='https://support.signal.org/hc/article_attachments/360016877511/typing-animation-3x.gif' /></div>: ''}
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
          </div>
        }
          </div>
        }
      </React.Fragment>
    )
  }
}

export default App;

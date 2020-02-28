
import { Component } from 'react'
import Layout from '../components/layout';
import Form from '../components/form';
import Link from 'next/link';

class Login extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            username: '',
            password: ''
        };

        this.changeUsername = this.changeUsername.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    changeUsername(event) {
        this.setState({ username: event.target.value });
    }
    changePassword(event) {
        this.setState({ password: event.target.value });
    }
    handleSubmit(event) {
        event.preventDefault();

        let url = new URL("http://localhost:3000/api/auth");
        let params = {email: this.state.username, password: this.state.password};
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

        fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            // todo: store a cookie with the authenticated user session
            // data.token.sessionToken
        }).catch((err) => {
            alert("Error: " + err.message);
        });
    }
    render() {
        return (
            <Layout>
                <Form>
                    <h2>Login</h2>
                    <p>Welcome back! Please enter your email and password to log in.</p>
                    <form onSubmit={this.handleSubmit} method="POST">
                        <div>
                            <input type="email" value={this.state.username} onChange={this.changeUsername} id="username" name="username" placeholder="Email address"></input>
                        </div>
                        <div>
                            <input type="password" value={this.state.password} onChange={this.changePassword} id="password" name="password" placeholder="Password"></input>
                        </div>
                        <div>
                            <input type="submit" value="Log In"></input>
                            <p>
                                Don't have an account yet?
                                <Link href="/profile/register">
                                    <a> Sign up now.</a>
                                </Link>
                            </p>
                        </div>
                    </form>
                </Form>
            </Layout>
        );
    }
}

export default Login
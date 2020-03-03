// NPM plugins
import React from 'react';
import Router from 'next/router';
import Cookies from 'js-cookie';

// Components
import ButtonLink from './ButtonLink';

// MaterialUI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: "100%"
        },
    },
    actionButtons: {
        marginTop: 15
    }
}));

const LoginForm = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    const classes = useStyles();

    const handleSubmit = event => {
        event.preventDefault();
    
        let url = new URL("http://localhost:3000/api/auth");
        let params = {email: username, password: password};
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    
        fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            if(!data.success) throw data;
            
            const expirationTime = 15 * 60 * 1000;
            Cookies.set('Token', data.token.sessionToken, { expires: expirationTime });
            Router.push('/');
        }).catch((err) => {
            alert(err.message);
        });
    };

    return (
        <form className={classes.root} onSubmit={handleSubmit} method="POST" autoComplete="off">
            <div>
                <TextField required id="email" label="Username" variant="outlined" onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
                <TextField required id="password" label="Password" variant="outlined" type="password" onChange={e => setPassword(e.target.value)} />
            </div>
            <Box display="flex" justifyContent="space-between" className={classes.actionButtons}>                
                <Button variant="contained" color="primary" size="large" type="submit">Log In</Button>
                <Button component={ButtonLink} href={"/profile/register"} color="primary">Create An Account</Button>    
            </Box>
        </form>
    );
}

export default LoginForm;
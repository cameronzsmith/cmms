// NPM plugins
import React from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Router from 'next/router';

// React components
import Layout from '../components/Layout';
import LoginForm from '../components/LoginForm';

// MaterialUI
import { Grid, Card, Container } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    root: {
        marginTop: 30,
        textAlign: "center",
    },
    item: {
        margin: 0,
    },
    card: {
        padding: "10px 30px",
    },
}));

export default function Login () {
    //const token = Cookies.get("Token");
    //if(token !== undefined) Router.push("/");

    const classes = useStyles();
    return (
        <Container>
            <Grid container spacing={3} direction="column" alignItems="center" justify="center" className={classes.root}>
                <Grid item xs={12} className={classes.item}>
                    <Link href="/">
                        <a><img src="https://via.placeholder.com/350x150?text=Your+Brand+Here" /></a>
                    </Link>
                </Grid>
                <Grid item xs={12}>
                    <Card className={classes.card}>
                        <h2>Login</h2>
                        <p>Welcome back! Please enter your email and password to log in.</p>
                        <LoginForm />
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};
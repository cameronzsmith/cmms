// NPM plugins
import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import Cookies from 'js-cookie';

// Material UI
import { AppBar, CssBaseline, Collapse, Drawer, Toolbar, List, ListSubheader, ListItem, ListItemIcon, ListItemText, Divider, Typography, IconButton } from '@material-ui/core'
import { Menu, Close, ExpandLess, ExpandMore, Build, Home, Assignment, AccountTree, Public, Category, LocalShipping, ImageAspectRatio, Group, ShoppingCart, Chat, ListAlt } from '@material-ui/icons';
import { makeStyles, useTheme } from '@material-ui/core/styles';

const navigationWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
      display: 'flex',
  },
  appBar: {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
  },
  appBarShift: {
    width: `calc(100% - ${navigationWidth}px)`,
    marginLeft: navigationWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  hide: {
    display: 'none',
  },
  navigation: {
      width: navigationWidth,
      flexShrink: 0,
  },
  navigationPaper: {
      width: navigationWidth,
  },
  navigationHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  toolbar: theme.mixins.toolbar,
  content: {
      flexGrow: 1,
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -navigationWidth,
      padding: theme.spacing(3),
  },
  contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

const Layout = props => {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setNavigationState] = React.useState(true);
    const [homeOpen, setHomeState] = React.useState(true);
    const [supportTablesOpen, setSupportTableState] = React.useState(true);
    const [partsOpen, setPartsState] = React.useState(true);

    const toggleNavigation = () => {
        setNavigationState(!open);
    };

    const toggleHome = () => {
        setHomeState(!homeOpen);
    }

    const toggleParts = () => {
        setPartsState(!partsOpen);
    }

    const toggleSupportTables = () => {
        setSupportTableState(!supportTablesOpen);
    };

    const HomeLinks = {
        titles: ['Assets', 'Work Orders', 'Messages'],
        icons: [<ImageAspectRatio />, <Assignment />, <Chat />]
    }

    const PartsLinks = {
        titles: ['Purchase Orders', 'Inventory'],
        icons: [<ShoppingCart />, <ListAlt />]
    }

    const SupportTableLinks = {
        titles: ['Locations', 'Categories', 'Vendors', 'Users'],
        icons: [<Public />, <Category />, <LocalShipping />, <Group />]
    }

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={clsx(classes.appBar, { [classes.appBarShift]: open, })}>
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" onClick={toggleNavigation} edge="start" className={clsx(classes.menuButton, open && classes.hide)}>
                        <Menu />
                    </IconButton>
                    <Typography variant="h6" noWrap>
                        {props.title}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer className={classes.navigation} variant="persistent" open={open} classes={{ paper: classes.navigationPaper, }} anchor="left">
                <div className={classes.navigationHeader}>
                    <IconButton onClick={toggleNavigation}>
                        <Close />
                    </IconButton>
                </div>
                <Divider />
                <List component="nav" className={classes.navigation}>
                    <ListItem button onClick={toggleHome}>
                        <ListItemIcon>
                            <Home />
                        </ListItemIcon>
                        <ListItemText primary="Home" />
                        {homeOpen ? <ExpandLess /> : <ExpandMore />} 
                    </ListItem>
                    <Collapse in={homeOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {HomeLinks.titles.map((text, index) => (
                                <ListItem button key={text} className={classes.nested}>
                                    <ListItemIcon>
                                        {HomeLinks.icons[index]}
                                    </ListItemIcon>
                                    <ListItemText primary={text} />
                                </ListItem>
                            ))};
                        </List>
                    </Collapse>
                    <ListItem button onClick={toggleParts}>
                        <ListItemIcon>
                            <Build />
                        </ListItemIcon>
                        <ListItemText primary="Parts" />
                        {partsOpen ? <ExpandLess /> : <ExpandMore />} 
                    </ListItem>
                    <Collapse in={partsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {PartsLinks.titles.map((text, index) => (
                                <ListItem button key={text} className={classes.nested}>
                                    <ListItemIcon>
                                        {PartsLinks.icons[index]}
                                    </ListItemIcon>
                                    <ListItemText primary={text} />
                                </ListItem>
                            ))};
                        </List>
                    </Collapse>
                    <ListItem button onClick={toggleSupportTables}>
                        <ListItemIcon>
                            <AccountTree />
                        </ListItemIcon>
                        <ListItemText primary="Project Data" />
                        {supportTablesOpen ? <ExpandLess /> : <ExpandMore />} 
                    </ListItem>
                    <Collapse in={supportTablesOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {SupportTableLinks.titles.map((text, index) => (
                                <ListItem button key={text} className={classes.nested}>
                                    <ListItemIcon>
                                        {SupportTableLinks.icons[index]}
                                    </ListItemIcon>
                                    <ListItemText primary={text} />
                                </ListItem>
                            ))}
                        </List>
                    </Collapse>                
                </List>
            </Drawer>
            <main className={clsx(classes.content, {
                [classes.contentShift]: open,
            })}>
                <div className={classes.drawerHeader} />
                {props.children}
            </main>
        </div>
    );
};

export default Layout;
import { createMuiTheme } from '@material-ui/core/styles';

// Create a theme instance.
const theme = createMuiTheme({
    palette: {
      primary: {
        main: '#556cd6',
      },
      secondary: {
        main: '#19857b',
      },
      error: {
        main: "#f00",
      },
      background: {
        default: '#f5f5f5',
      },
    },
  });
  
  export default theme;
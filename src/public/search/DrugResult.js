import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { Link } from 'ot-ui';
import Highlights from '../common/Highlights';
import DrugIcon from '../../icons/DrugIcon';

const styles = theme => ({
  container: {
    marginBottom: '30px',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: 500,
  },
  icon: {
    color: theme.palette.primary.main,
    verticalAlign: 'bottom',
  },
});

const DrugResult = ({ classes, data, highlights }) => {
  return (
    <div className={classes.container}>
      <Link to={`drug/${data.id}`} className={classes.subtitle}>
        <DrugIcon className={classes.icon} /> {data.name}
      </Link>
      <Highlights highlights={highlights} />
    </div>
  );
};

export default withStyles(styles)(DrugResult);
// Import request function, set it up for v1, export it
import requestHelper from '../../reqeustHelper';

requestHelper.setApiVersion('v1');
export { requestHelper };
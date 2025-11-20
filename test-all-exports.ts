// Test all the named exports that are now available
import { 
  container, 
  codecept, 
  Codecept,
  output, 
  event, 
  recorder, 
  config, 
  actor, 
  helper, 
  Helper,
  pause, 
  within, 
  dataTable, 
  dataTableArgument, 
  store, 
  locator,
  heal,
  ai,
  Workers,
  Secret, 
  secret 
} from "codeceptjs";

// Also test default import
import codeceptjs from "codeceptjs";

console.log("✅ All named exports are accessible!");

const { I } = inject();

export default {
  login(username: string) {
    I.say(`Logging in with user: ${username}`);
  },
  
  logout() {
    I.say('Logging out');
  }
};

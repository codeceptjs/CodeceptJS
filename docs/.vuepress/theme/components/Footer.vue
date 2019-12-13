<template>
  <footer>
    <section>
      <div class="col">
        <h4>Docs</h4>

        <ul>
          <li>
            <router-link to="/quickstart">Quickstart</router-link>
          </li>
          <li>
            <router-link to="/basics">Getting Started</router-link>
          </li>
          <li>
            <router-link to="/puppeteer">CodeceptJS & Puppeteer</router-link>
          </li>
          <li>
            <router-link to="/puppeteer">CodeceptJS & WebDriver</router-link>
          </li>
        </ul>
      </div>
      <div class="col">
        <h4>Community</h4>
        <ul>
          <li><a href="https://github.com/Codeception/CodeceptJS">GitHub</a></li>
          <li><a href="http://bit.ly/chat-codeceptjs">Slack Chat</a></li>
          <li><a href="https://codecept.discourse.group/">Forum</a></li>
          <li><a href="https://twitter.com/codeceptjs">Twitter</a></li>
        </ul>
      </div>
      <div class="col">
        <h4 class="important">Commercial Support</h4>
        <ul>
          <li><a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=footer&utm_term=link&utm_campaign=reference">Consulting</a></li>
          <li><a href="http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=top_menu&utm_term=link&utm_campaign=reference">Trainings</a> </li>
          <li><a href="https://sdclabs.com/#services">Hire Engineers</a></li>
        </ul>
      </div>
    </section>
    <div class="copyright">
    <h5>CodeceptJS - supercharged end 2 end testing framework for NodeJS</h5>
      © {{ year }}
    </div>
  </footer>
</template>

<script>
export default {
  data() {
    return {
      year: (new Date()).getFullYear(),
    }
  }
}
</script>

<style lang="scss" scoped>
  footer {
    border-top: 5px dashed #fff;
    @apply bg-gray-100 mt-4;
    .copyright {
      border-top: 5px dashed;
      @apply bg-purple-600 py-2 text-center text-xs border-gray-200 text-gray-400;
    }

    ul {
      @apply list-none list-outside pl-0 ml-0;
    }

    .important:before {
      margin-left: -20px;
      content: '⬤';
      @apply text-red-500 text-xs mr-2;
    }

    h5 {
      @apply mb-4 text-xs uppercase;
    }
    section {
      max-width: 960px;
      margin: 0 auto;
      @apply flex;
      .col {
        @apply flex-auto px-2;
      }
    }

    // @apply bg-purple-800;
  }
</style>
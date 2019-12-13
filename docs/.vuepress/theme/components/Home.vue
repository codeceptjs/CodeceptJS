<template>
  <main class="home" aria-labelledby="main-title">
    <header class="hero">
  <div class="mountains">
      <img
        v-if="data.heroImage"
        :src="$withBase(data.heroImage)"
        :alt="data.heroAlt || 'hero'"
      >

      <h1>
        Supercharged<br><span class="name">End 2 End</span> Testing
      </h1>

      <img src="/img/code.png" alt="" />

        <div class="video">
          <a href="#" @click="toggleVideo">📺 Watch a video ▶</a>
          <div v-if="showVideo" class="videoModal">
            <video controls="" src="/img/codeceptjs_demo.mp4" style="width:100%;padding:20px"></video>
          </div>
        </div>

      <p
        class="action"
        v-if="data.actionText && data.actionLink"
      >
        <NavLink
          class="action-button"
          :item="actionLink"
        />
      </p>
  </div>
    </header>
<div class="frameworks">
    <div class="content">
      <h4>
        Plays nicely with your favorite frameworks &rarr;
          <router-link to="/react"><img src="/img/react.svg" alt="React" ></router-link>
          <router-link to="/vue"><img src="/img/vue.svg" alt="Vue" ></router-link>
          <router-link to="/angular"><img src="/img/AngularLogo.png" alt="Angular" ></router-link>
      </h4>
    </div>
</div>


    <div class="content">

  <div class="flex features">

    <div class="feature">
      <img src="/img/Checklist.svg" alt="" />
      <div class="inner">
      <h5>Scenario Driven</h5>
        Write acceptance tests from user's perspective.
        Make tests readable and easy to follow.
      </div >
    </div>
    <div class="feature">
      <img src="/img/Mind-Map-Paper.svg" alt="" />
      <div class="inner"><h5>Driver Agnostic</h5>
        Run your tests via <b>WebDriver, Puppeteer, TestCafe, Protractor, Appium</b>. The code is the same.
        <router-link to="/basics#architecture">Learn More</router-link></div>
    </div>
    <div class="feature">
      <img src="/img/Coding-Html.svg" alt="" />
      <div class="inner"><h5>Interactive Debug</h5>
        Control tests as they run. Pause tests at any point and execute commands to try locators.
        <router-link to="/basics#debug">Learn More</router-link></div>
    </div>
  </div>
  <div class="features">
    <div class="feature">
      <img src="/img/Prism-3.svg" alt="" />
      <div class="inner"><h5>Rich Locators</h5>
      Use semantic locators, CSS, XPath to find elements on page
      <router-link to="/locators">Learn More</router-link></div>
    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(45deg); transform: rotate(225deg)" alt="" />
      <div class="inner"><h5>PageObjects</h5>
      PageObjects are essential to write stable and reusable code!
      <router-link to="/pageobjects">Learn More</router-link></div>
    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(90deg); transform: rotate(180deg)" alt="" />
      <div class="inner"><h5>Web & Mobile Testing</h5>
      Test native mobile apps using <b>Appium</b> or <b>Detox</b>.
      <router-link to="/mobile">Learn More</router-link></div>
    </div>

  </div>
  <div class="features">


    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(135deg); transform: rotate(45deg)" alt="" />
      <div class="inner"><h5>Cucumber-like BDD</h5>
      Automate business scenarios as you do in CucumberJS
      <router-link to="/bdd">Learn More</router-link>
      </div >
    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(180deg); transform: rotate(90deg)" alt="" />
      <div class="inner"><h5>Beautiful Reports</h5>
      Integrated with Allure reporter
      <router-link to="/plugins#allure">Learn More </router-link>
      </div >
    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(225deg); transform: rotate(135deg)" alt="" />
      <div class="inner"><h5>Data Management</h5>
      Create fake data and clean it up via REST API
      <router-link to="/data">Learn More </router-link>
      </div >
    </div>

  </div>
  <div class="features">

    <div class="feature">
      <img src="/img/Prism-3.svg" style="transform: rotate(90deg); filter: hue-rotate(60deg) saturate(20%)" alt="" />
      <div class="inner"><h5>Parallel Testing</h5>
      Tests are split into chunks and executed in multiple processes.
      <router-link to="/advanced#parallel-execution">Learn More </router-link>
      </div >

    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(105deg) saturate(20%); transform: 'rotate(45deg)" alt="" />
      <div class="inner"><h5>Reduced Flackiness</h5>
      Automatically retry failed steps
      <router-link to="/basics#retries">Learn More </router-link>
      </div >
    </div>

    <div class="feature">
      <img src="/img/Prism-3.svg" style="filter: hue-rotate(135deg) saturate(20%); transform: 'rotate(0deg)" alt="" />
      <div class="inner"><h5>Multi-Session Testing</h5>
      Run a test using several browser windows

      </div >
    </div>
  </div>



    </div>


<div class="demos">
<ClientOnly>
  <Slides />
</ClientOnly>
</div>

<div class="content">
  <Content slot-key="code"></Content>
</div>

<section class="testimonials">
  <div class="inner">
  <h2 class="text-center">Trusted By Enterprises</h2>
  <div class="row">
    <div class="quote">
      <p>
        We have been using CodeceptJS as our UI testing framework, and it has made writing tests so simp  le for us, the amount of options and features available in CodeceptJS just out of the box are perfect for us to <b>test an application like Percona Monitoring and Management</b> (PMM), with so many dashboards & Metric plots.
        We would recommend CodeceptJS to anyone who is looking for a Javascript based testing framework.
      </p>
      <div class="signature">
        <img src="/img/kala.jpg"></img>

        <div class="position"><b>Puneet Kala</b><br> Frontend QA Automation Engineer at <b>Percona</b></div>
      </div>
    </div>
    <div class="quote">
      <p >
      We were searching for a solution to write tests which are good to read and easy to write. It must be able to run on several browsers and understandable across different teams with different knowledge and different frameworks in usage. <b>CodeceptJS helps us with all this and much more at Porsche</b> and we are happy that we made that decision.
      </p>
      <div class="signature">
        <img src="/img/mitko.jpg"></img>
        <div class="position"><b>Mitko Tschimev</b><br> Frontend Tech Lead at <b>My Porsche Core</b></div>
      </div>
    </div>
  </div>
  <div class="commercial">
    CodeceptJS offers enterprise support!<br>
     <a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=front&utm_term=link&utm_campaign=reference">Contact SDCLabs for</a>
     <a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=front&utm_term=link&utm_campaign=reference"><b>consulting</b></a>,
     <a href="http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=front&utm_term=link&utm_campaign=reference"><b>trainings</b></a>,
     or hire engineers to write tests for you.
  </div>
  </div>
 </section>


  <Footer />
  </main>
</template>

<script>
import NavLink from '@theme/components/NavLink.vue'
import Slides from './Slides';
import Footer from './Footer';

export default {
  components: { NavLink, Footer, Slides },

  data() {
    return {
      showVideo: false,
    }
  },

  methods: {
    toggleVideo() {
      this.showVideo = !this.showVideo;
      const hideVideo = () => {
        this.showVideo = false;
        document.body.removeEventListener('click', hideVideo);
      }
      setTimeout(() => document.body.addEventListener('click', hideVideo), 0);
      return false;
    },
    hideVideo() {
      this.showVideo = false;
    }
  },

  computed: {
    data () {
      return this.$page.frontmatter;
    },

    actionLink () {
      return {
        link: this.data.actionLink,
        text: this.data.actionText
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mountains {
  background:  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1900' height='650' viewBox='0 0 1600 900'%3E%3Cpolygon fill='%2376509a' points='957 450 539 900 1396 900'/%3E%3Cpolygon fill='%2332184b' points='957 450 872.9 900 1396 900'/%3E%3Cpolygon fill='%237b53a0' points='-60 900 398 662 816 900'/%3E%3Cpolygon fill='%233c1d5a' points='337 900 398 662 816 900'/%3E%3Cpolygon fill='%237e59a1' points='1203 546 1552 900 876 900'/%3E%3Cpolygon fill='%2347236a' points='1203 546 1552 900 1162 900'/%3E%3Cpolygon fill='%23815ea6' points='641 695 886 900 367 900'/%3E%3Cpolygon fill='%2352277a' points='587 900 641 695 886 900'/%3E%3Cpolygon fill='%238661ab' points='1710 900 1401 632 1096 900'/%3E%3Cpolygon fill='%235b2d88' points='1710 900 1401 632 1365 900'/%3E%3Cpolygon fill='%238c61b4' points='1210 900 971 687 725 900'/%3E%3Cpolygon fill='%2367329b' points='943 900 1210 900 971 687'/%3E%3C/svg%3E");
  background-position: bottom left;
}

.content {
  @apply pb-8;
}

.testimonials {
  border-top: 5px dashed;
  @apply bg-white my-4 py-8 border-gray-200;
  .inner {
    max-width: 960px;
    margin: 0 auto;

    .commercial {
      border: 5px dashed #fff;
      line-height: 2;
      @apply rounded text-center mt-8 bg-yellow-100 text-gray-700 p-8;
    }
    .row {
      @apply flex;


      .quote {

        @apply flex-1 px-2 ;
        .signature {
          @apply flex items-center content-center;

        }
        p {
          &:before {
            content: '“';
            font-size: 72px;
            @apply text-blue-400;
            position: absolute;
            top: 0;
            left: 0px;
          }
          position: relative;
          @apply text-sm text-gray-600 p-4 pl-10;
        }
        img {
          border-radius: 30px;
          width: 60px;
          height: 60px;
          @apply mr-4 flex-initial;
        }
        .position {
          @apply text-sm flex-1;
        }
      }
    }
  }
}

.frameworks {
  border-bottom: 5px dashed;
  @apply bg-white border-gray-100;
  text-align: center;
  .content {
  }
  img {
    filter: grayscale(1);
    width: 50px;
    height: 50px;
    vertical-align: middle;
    &:hover {
      filter: grayscale(0);
    }
  }
}

.demos {
  border-top: 5px dashed;
  border-bottom: 5px dashed;
  @apply bg-white my-4 py-8 border-gray-100;
}


.features {
  @apply flex my-2;
  img {
    width: 120px;
    @apply mr-4;
    opacity: 0.8;
    transition: opacity 1s;
    &:hover {
      opacity: 1;
    }
    // display: inline;
    // @apply flex-1;
  }
}
.feature {
  @apply w-1/3 flex mb-10 border-white pl-1;
  .inner {
    line-height: 1.75;
    @apply flex-1 pr-4;
    text-align: left;
  }
  a {
    @apply rounded bg-white px-1;
    display: inline-block;

  }
}
.features h5 {
  font-size: 100%;
  line-height: 1.5;
}

@media(max-width: 600px) {

  .frameworks {
    display: none;
  }

  .home {
    .content {
      padding-top: 0;
      max-width: 100%;
      @apply text-sm px-1;
    }
  }

  body .features {
    .feature {
      width: 100%;
      @apply px-1 mb-0 text-sm;

      img {
        width: 48px;
        height: 48px;
        margin-right: 5px;
        margin-top: 10px;
      }
    }
  }

  body .testimonials {
    .row {
      display: block !important;
    }
    @apply px-1;
  }
}
@media(max-width: 1200px) {
  .demos {
    display: none;
  }
  .feature {
    padding: 0;
  }

}

</style>

<style lang="stylus">
.home
  @apply bg-gray-100
  max-width 100%
  display block
  h1
    @apply text-gray-400
    .name
      @apply text-gray-200
  .hero
    padding $navbarHeight 2rem 0
    @apply text-gray-400
    border-top 5px dashed #8065d5;
    margin-top $navbarHeight;
    border-bottom 5px dashed #fff;
    background url(/img/back.png) #805ad5;
    text-align center
    .video
      margin-top -30px
      a
        cursor pointer
        border-bottom 1px dashed #fff
        z-index 1000
        @apply text-white text-sm
      .videoModal
        position absolute
        top 30px
        left 0
        right 0
        bottom 0
        padding 20px
        background rgba(#fff, 0.5)
        video
          z-index 10000
          max-width 800px

    img
      max-width: 600px
      display block
      margin 3rem auto 1.5rem
      margin-top 0
    h1
      font-size 3rem
    h1, .description, .action
      margin 1.8rem auto
      margin-bottom 0
    .description
      max-width 35rem
      font-size 1.6rem
      line-height 1.3
      color lighten($textColor, 40%)
    .action-button
      @apply shadow-xl
      display inline-block
      font-size 1.8rem
      color #fff
      background-color $accentColor
      padding 1rem 3rem
      border-radius 4px
      border 1px solid rgba(#fff, 0.5);
      border-bottom none
      transition background-color .1s ease
      box-sizing border-box
      margin-bottom -60px
      &:hover
        background-color lighten($accentColor, 10%)

  .content


    max-width 1200px
    margin 0 auto
    padding-top 3rem

  .footer
    padding 2.5rem
    border-top 1px solid $borderColor
    text-align center
    color lighten($textColor, 25%)

@media (max-width: $MQMobile)
  .home
    .features
      flex-direction column
    .feature
      max-width 100%
      padding 0 2.5rem

@media (max-width: $MQMobileNarrow)
  .home
    padding: 0
    .hero
      .video
        margin-top 20px
      img
        display none
        max-height 210px
        margin 2rem auto 1.2rem
      h1
        font-size 2rem
      h1, .description, .action
        margin 1.2rem auto
      .description
        font-size 1.2rem
      .action-button
        font-size 1rem
        padding 0.6rem 1.2rem
    .feature
      h2
        font-size 1.25rem
</style>

<style lang="scss" scoped>
header {

}
</style>
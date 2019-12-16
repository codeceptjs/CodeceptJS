<template>
  <div class="slider">
    <carousel v-if="carouselComp" :is="carouselComp"
      :navigationEnabled="true"
      :autoplayTimeout="10000"
      :autoplay="true"
      :per-page="1"
      :center-mode="true" >
      <slide :is="slideComp">
        <div class="slide">
          <img src="/img/pause.gif" alt="">
          <div>
            <Content slot-key="pause"/>
          </div>
        </div>
      </slide>
      <slide :is="slideComp">

        <div class="slide" >
          <img src="/img/test.gif" alt="">
          <div>
            <Content slot-key="run"/>
          </div>
        </div>
      </slide>
      <slide :is="slideComp">
        <div class="slide" >
          <img src="/img/edit.gif" alt="">
          <div>
            <Content slot-key="autocomplete"/>
          </div>
        </div>
      </slide>
      <slide :is="slideComp">
        <div class="slide" >
          <img src="/img/codeceptui.gif" alt="">
          <div>
            <Content slot-key="ui"/>
            <router-link to="ui" class="button green">Try CodeceptUI &rarr;</router-link>
          </div>
        </div>
      </slide>



      <slide :is="slideComp">
        <div class="slide">
          <img src="/img/new-test.gif" alt="">
          <div>
            <Content slot-key="write"/>
            <router-link to="ui" class="button green">Try CodeceptUI &rarr;</router-link>
          </div>
        </div>
      </slide>

    </carousel>
  </div>
</template>

<script>
// import { Carousel, Slide } from 'vue-carousel';

export default {
  // components: {
  //   Carousel,
  //   Slide
  // },
  data() {
    return {
      slideComp: null,
      carouselComp: null,
    }
  },
  mounted () {
    import('vue-carousel').then(module => {
      this.slideComp = module.Slide;
      this.carouselComp = module.Carousel;
    });
  }
}
</script>

<style lang="scss">

.slider {
  max-width: 1200px;
  margin: 0 auto;
  .VueCarousel-pagination {
    margin-top: -40px;
  }
}

.slide {
  @apply flex items-center;
  img {
    border: 5px solid;
    width: 50%;
    height: 50%;
    @apply mr-4 border-gray-200 shadow-md rounded-lg;
  }
  & > div {
    @apply flex-1;
  }

}
</style>
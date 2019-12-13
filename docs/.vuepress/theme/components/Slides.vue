<template>
  <div class="slider">
    <carousel
      :navigationEnabled="true"
      :autoplayTimeout="10000"
      :autoplay="true"
      :per-page="1"
      :center-mode="true" >
      <slide>
        <div class="slide">
          <img src="/img/pause.gif" alt="">
          <div>
            <Content slot-key="pause"/>
          </div>
        </div>
      </slide>
      <slide>

        <div class="slide">
          <img src="/img/test.gif" alt="">
          <div>
            <Content slot-key="run"/>
          </div>
        </div>
      </slide>
      <slide>
        <div class="slide">
          <img src="/img/edit.gif" alt="">
          <div>
            <Content slot-key="autocomplete"/>
          </div>
        </div>
      </slide>
      <slide>
        <div class="slide">
          <img src="/img/codeceptui.gif" alt="">
          <div>
            <Content slot-key="ui"/>
            <router-link to="ui" class="button green">Try CodeceptUI &rarr;</router-link>
          </div>
        </div>
      </slide>



      <slide>
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
import { Carousel, Slide } from 'vue-carousel';

export default {
  components: {
    Carousel,
    Slide
  },
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
    border-right: 5px solid;
    width: 50%;
    height: 50%;
    @apply mr-4 border-gray-200 shadow-md rounded-lg;
  }
  & > div {
    @apply flex-1;
  }

}
</style>
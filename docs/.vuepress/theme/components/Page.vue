<template>
  <main class="page">
    <div class="article-title">{{title}}</div>

    <RightSidebar />


    <slot name="top">
    </slot>


    <div class="post">
      <article>
        <Content class="theme-default-content" />
      </article>
    </div>
    <PageEdit />
    <PageNav v-bind="{ sidebarItems }" />

    <slot name="bottom" />

    <Footer/>
  </main>
</template>

<script>
import PageEdit from '@theme/components/PageEdit.vue'
import PageNav from '@theme/components/PageNav.vue'
import Footer from './Footer.vue'
import RightSidebar from './RightSidebar.vue'

export default {
  components: { PageEdit, PageNav, Footer, RightSidebar },
  props: ['sidebarItems'],

  computed: {
    title() {
      return this.$page.title;
    }
  }
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'
@require '../styles/highlight.css'

.article-title
  @apply text-black uppercase

.page
  padding-bottom 2rem
  display block

</style>

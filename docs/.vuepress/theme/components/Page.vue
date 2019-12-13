<template>
  <main class="page">

    <RightSidebar />


    <slot name="top" />

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
  props: ['sidebarItems']
}
</script>

<style lang="stylus">
@require '../styles/wrapper.styl'
@require '../styles/highlight.css'

.page
  padding-bottom 2rem
  display block

</style>

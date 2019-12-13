<template>
    <section class="sidebar">

      <h4>More Information</h4>

      <p>
        <router-link to="/videos">Videos</router-link>
      </p>
      <p>
        <router-link to="/books">Books & Posts</router-link>
      </p>
      <p>
        <router-link to="/examples">Examples</router-link>
      </p>
      <p>
        <a href="https://codecept.discourse.group/c/cookbook" >Cookbook &rarr;</a>
      </p>

      <h4>More from CodeceptJS Team</h4>

      <p>
        <a href="http://sdclabs.com/codeceptjs?utm_source=codecept.io&utm_medium=right&utm_term=link&utm_campaign=reference" class="dashed">
          Commercial Services &rarr;
        </a>
      </p>

      <p>
        <a href="http://sdclabs.com/trainings/web-automation-codeceptjs?utm_source=codecept.io&utm_medium=rigth&utm_term=link&utm_campaign=reference" class="dashed">
          Trainings &rarr;
        </a>
      </p>


      <p>
        <a href="https://testomat.io" class="dashed">
          Testomat.io &rarr;
        </a><br>
        <small>Plan your automated tests with ease</small>
      </p>

    </section>
</template>

<style lang="scss" scoped>

.sidebar {
  position: fixed;
  // zoom: 0.75;
  top: 80px;
  left: auto;
  right: 0px;
  bottom: auto;
  opacity: 0.7;
  @apply text-sm bg-yellow-100 rounded px-8 py-4;

  p {
    @apply my-4;
  }

  a {
    @apply text-blue-600;
  }

  a.dashed {
    @apply border-gray-200 text-blue-600;
    border-bottom: 1px dashed;
  }
}

@media (max-width: 1300px) {
  .sidebar {
    display: none;
  }
}

</style>

<script>
export default {

}
</script>
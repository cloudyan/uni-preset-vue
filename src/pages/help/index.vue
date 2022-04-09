<template>
  <view class="page page-padding">
    <view class="content" @click="goNext">
      <view
        v-for="(item, index) in list"
        :key="index"
        :data-link="item.link"
        :class="item.link ? `link ${item.status}` : 'title'"
      >{{item.name}}</view>
    </view>
  </view>
</template>

<script lang="ts">
const list = [
  // demo
  {name: '分组'}, // 职位浏览 推荐recommend 附近LBS 最新
  {name: '首页', link: '/pages/index/index', status: ''},
]

export default {
  data() {
    return {
      list,
    }
  },
  methods: {
    goNext(e: any) {
      const {link} = e.target.dataset
      link && this.$forward(link)
    },
  },
}
</script>

<style lang="scss" scoped>
.title {
  margin: 40rpx 0 20rpx;
  font-size: 12px;
  font-weight: bold;
}
.link {
  margin: 20rpx 0;
  padding-left: 40rpx;
  cursor: pointer;

  // sdsd

  &:hover {
    text-decoration: underline;
  }

  &::after {
    content: '🔗';
    font-size: 24rpx;
    padding-left: 10rpx;
  }
}

.todo {
  color: gray;
}

.doing {
  color: orange;
}

.done {
  color: green;
}
</style>

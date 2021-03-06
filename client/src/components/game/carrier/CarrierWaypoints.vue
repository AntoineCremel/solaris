<template>
	<div class="menu-page container" v-if="carrier">
    <menu-title :title="carrier.name" @onCloseRequested="onCloseRequested">
			<span class="mr-2">{{carrier.ships == null ? '???' : carrier.ships}} <i class="fas fa-rocket"></i></span>
    </menu-title>

		<strong>Waypoints</strong>:
    <span v-if="!carrier.waypoints.length" class="text-warning">None</span>
		<ul class="pl-4 mt-2" v-if="isStandardUIStyle">
			<li v-for="waypoint in carrier.waypoints" :key="waypoint._id">
				<!-- <a href="javascript:;" @click="onOpenStarDetailRequested(waypoint.destination)">{{getStarName(waypoint.destination)}}</a> -->
				<span>{{getStarName(waypoint.destination)}}</span>

				<i class="ml-2" :class="{
					'fas fa-angle-double-up text-success': waypoint.action == 'collectAll',
					'fas fa-angle-double-down text-danger': waypoint.action == 'dropAll',
					'fas fa-caret-up text-success': waypoint.action == 'collect',
					'fas fa-caret-down text-danger': waypoint.action == 'drop',
					'fas fa-angle-up text-success': waypoint.action == 'collectAllBut',
					'fas fa-angle-down text-danger': waypoint.action == 'dropAllBut',
					'fas fa-star text-warning': waypoint.action == 'garrison'
				}"></i>
				<span v-if="waypoint.actionShips"> {{waypoint.actionShips}}</span>
			</li>
		</ul>

    <span v-if="isCompactUIStyle">{{waypointAsList}}</span>

		<div class="row bg-secondary pt-2 pb-2 mt-2">
			<div class="col-12">
				<p class="mb-1" v-if="totalEtaTimeString && carrier.waypoints.length">ETA: {{totalEtaTimeString}}</p>
			</div>
			<div class="col">
				<button class="btn btn-sm btn-warning" @click="removeLastWaypoint()" :disabled="isSavingWaypoints"><i class="fas fa-undo"></i> Last</button>
				<button class="btn btn-sm btn-danger ml-1" @click="removeAllWaypoints()" :disabled="isSavingWaypoints"><i class="fas fa-trash"></i> All</button>
				<button class="btn btn-sm ml-1" :class="{'btn-success':carrier.waypointsLooped,'btn-primary':!carrier.waypointsLooped}" @click="toggleLooped()" :disabled="!canLoop" title="Loop/Unloop Waypoints"><i class="fas fa-sync"></i></button>
			</div>
			<div class="col-auto">
				<button class="btn btn-sm btn-success ml-1" @click="saveWaypoints()" :disabled="isSavingWaypoints"><i class="fas fa-save"></i> Save</button>
				<button class="btn btn-sm btn-success ml-1" @click="saveWaypoints(true)" :disabled="isSavingWaypoints"><i class="fas fa-edit"></i> Save &amp; Edit</button>
			</div>
		</div>
	</div>
</template>

<script>
import MenuTitle from '../MenuTitle'
import GameHelper from '../../../services/gameHelper'
import GameContainer from '../../../game/container'
import CarrierApiService from '../../../services/api/carrier'
import AudioService from '../../../game/audio'

export default {
  components: {
    	'menu-title': MenuTitle
  },
  props: {
    carrierId: String
  },
  data () {
    return {
      audio: null,
      userPlayer: null,
      carrier: null,
      isSavingWaypoints: false,
      oldWaypoints: [],
      totalEtaTimeString: null,
      waypointCreatedHandler: null,
      isStandardUIStyle: false,
      isCompactUIStyle: false
    }
  },
  mounted () {
    this.isStandardUIStyle = this.$store.state.settings.interface.uiStyle === 'standard'
    this.isCompactUIStyle = this.$store.state.settings.interface.uiStyle === 'compact'

    this.userPlayer = GameHelper.getUserPlayer(this.$store.state.game)
    this.carrier = GameHelper.getCarrierById(this.$store.state.game, this.carrierId)

    GameContainer.setMode('waypoints', this.carrier)

    this.waypointCreatedHandler = this.onWaypointCreated.bind(this)
    	GameContainer.map.on('onWaypointCreated', this.waypointCreatedHandler)

    this.oldWaypoints = this.carrier.waypoints.slice(0)

    this.recalculateTotalEta()
  },
  destroyed () {
    GameContainer.resetMode()

    GameContainer.map.off('onWaypointCreated', this.waypointCreatedHandler)
  },
  methods: {
    onCloseRequested (e) {
      this.carrier.waypoints = this.oldWaypoints

      this.$emit('onCloseRequested', e)
    },
    onOpenStarDetailRequested (e) {
      this.$emit('onOpenStarDetailRequested', e)
    },
    getStarName (starId) {
      return this.$store.state.game.galaxy.stars.find(s => s._id === starId).name
    },
    getWaypointsString () {
      if (!this.carrier.waypoints.length) {
        return 'None'
      }

      return this.carrier.waypoints.map(w => this.getStarName(w.destination)).join(', ')
    },
    removeLastWaypoint () {
      // If the carrier is not currently in transit to the waypoint
      // then remove it.
      let lastWaypoint = this.carrier.waypoints[this.carrier.waypoints.length - 1]

      if (!GameHelper.isCarrierInTransitToWaypoint(this.carrier, lastWaypoint)) {
        this.carrier.waypoints.splice(this.carrier.waypoints.indexOf(lastWaypoint), 1)

        GameContainer.drawWaypoints()
      }

      if (!this.carrier.waypoints.length) {
        this.totalEtaTimeString = null
      }

      AudioService.backspace()

      this.recalculateTotalEta()
      this.recalculateLooped()
    },
    removeAllWaypoints () {
      // Remove all waypoints up to the last waypoint (if in transit)
      this.carrier.waypoints = this.carrier.waypoints.filter(w => GameHelper.isCarrierInTransitToWaypoint(this.carrier, w))

      GameContainer.draw()

      this.totalEtaTimeString = null

      AudioService.backspace()

      this.recalculateTotalEta()
      this.recalculateLooped()
    },
    onWaypointCreated (e) {
      // Overwrite the default action and default action ships
      e.action = this.$store.state.settings.carrier.defaultAction
      e.actionShips = this.$store.state.settings.carrier.defaultAmount

      AudioService.type()

      this.recalculateTotalEta()
      this.recalculateLooped()
    },
    recalculateTotalEta () {
      let totalTicksEta = GameHelper.calculateWaypointTicksEta(this.$store.state.game, this.carrier,
        this.carrier.waypoints[this.carrier.waypoints.length - 1])

      this.totalEtaTimeString = GameHelper.getCountdownTimeStringByTicks(this.$store.state.game, totalTicksEta)
    },
    recalculateLooped () {
      if (this.carrier.waypointsLooped) {
        this.carrier.waypointsLooped = this.canLoop
      }
    },
    toggleLooped () {
      this.carrier.waypointsLooped = !this.carrier.waypointsLooped
    },
    async saveWaypoints (saveAndEdit = false) {
      // Push the waypoints to the API.
      try {
        this.isSavingWaypoints = true
        let response = await CarrierApiService.saveWaypoints(this.$store.state.game._id, this.carrier._id, this.carrier.waypoints, this.carrier.waypointsLooped)

        if (response.status === 200) {
          AudioService.join()

          // Update the waypoints
          this.carrier.ticksEta = response.data.ticksEta
          this.carrier.ticksEtaTotal = response.data.ticksEtaTotal
          this.carrier.waypoints = response.data.waypoints

          this.oldWaypoints = this.carrier.waypoints

          this.$toasted.show(`${this.carrier.name} waypoints updated.`)

          GameContainer.reloadCarrier(this.carrier)
          
          if (saveAndEdit) {
            if (this.carrier.waypoints.length) {
              this.$emit('onEditWaypointRequested', {
                carrierId: this.carrier._id,
                waypoint: this.carrier.waypoints[0]
              })
            } else {
              this.$emit('onOpenCarrierDetailRequested', this.carrier._id)
            }
          } else {
            this.onCloseRequested()
          }
        }
      } catch (e) {
        console.error(e)
      }

      this.isSavingWaypoints = false
    }
  },
  computed: {
    canLoop () {
      return GameHelper.canLoop(this.$store.state.game, this.userPlayer, this.carrier)
    },
    waypointAsList () {
      return this.carrier.waypoints.map(w => this.getStarName(w.destination)).join(', ')
    }
  }
}
</script>

<style scoped>
li {
	list-style-type: none;
}
</style>

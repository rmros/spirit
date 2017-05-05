import config from '../config/config'
import { gsap, debug } from '../utils'
import Timelines from './timelines'
import { EventEmitter } from 'events'
import { emitChange } from '../utils/emitter'

/**
 * Group.
 */
class Group extends EventEmitter {

  _name = 'untitled'
  _timeScale = 1
  _timelines = new Timelines()

  timeline = null

  /**
   * Create a group instance.
   *
   * @param {object} props
   */
  constructor(props = {}) {
    super()
    this.setMaxListeners(Infinity)

    if (!props.name || typeof props.name !== 'string' || props.name.trim() === '') {
      throw new Error('Cannot create group without a name.')
    }

    const defaults = {
      name: 'untitled',
      timeScale: 1,
      timelines: new Timelines()
    }

    Object.assign(this, {
      ...defaults,
      ...props
    })
  }

  /**
   * Get timelines
   *
   * @returns {Timelines}
   */
  get timelines() {
    return this._timelines
  }

  /**
   * Set timelines
   *
   * @param {Timelines} timelines
   */
  @emitChange()
  set timelines(timelines) {
    if (!(timelines instanceof Timelines)) {
      timelines = new Timelines(Array.from(timelines))
    }
    this._timelines = timelines
  }

  /**
   * Get current timeScale
   *
   * @returns {number}
   */
  get timeScale() {
    return this._timeScale
  }

  /**
   * Set fps
   *
   * @param {number} scale
   */
  @emitChange()
  set timeScale(scale) {
    if (!(typeof scale === 'number' && isFinite(scale))) {
      throw new Error('timeScale needs to be a number')
    }

    if (this.timeline && this.timeline instanceof config.gsap.timeline) {
      this.timeline.timeScale(scale)
    }

    this._timeScale = scale
  }

  /**
   * Get the timeline duration.
   * Equal to this.timeline.duration()
   *
   * @returns {number}
   */
  get duration() {
    return this.timeline ? this.timeline.duration() : 0
  }

  /**
   * Set the timeline duration.
   * Updates the group timeScale
   *
   * @param {number} val
   */
  @emitChange()
  set duration(val) {
    if (this.timeline && this.timeline instanceof config.gsap.timeline) {
      this.timeline.duration(val)
      this.timeScale = this.timeline.timeScale()
      this._duration = this.timeline.duration()
    }
  }

  /**
   * Get name
   *
   * @returns {string}
   */
  get name() {
    return this._name
  }

  /**
   * Set name
   *
   * @param {string} name
   */
  @emitChange()
  set name(name) {
    if (typeof name !== 'string') {
      throw new Error('Name needs to be a string')
    }
    this._name = name
  }

  /**
   * Convert group to object
   *
   * @returns {object}
   */
  toObject() {
    const name = this.name
    const timeScale = this.timeScale
    const timelines = this.timelines.toArray()

    return { name, timeScale, timelines }
  }

  /**
   * Construct gsap timeline
   *
   * @returns {TimelineMax|TimelineLite}
   */
  construct() {
    try {
      if (!config.gsap.timeline || !config.gsap.tween) {
        if (debug) {
          console.warn(`
            Trying to construct group ${this.name}, but GSAP cannot be found.
            
            Did you forgot to call spirit.setup() ?
            
            @usage
                
                spirit.setup().then(function(){
                  // gsap is loaded here..
                })
          `)
        }
        throw new Error('GSAP cannot be found')
      }

      // initiate an empty GSAP timeline
      if (this.timeline && this.timeline instanceof config.gsap.timeline) {
        this.timeline.stop()
        this.timeline.kill()
        this.timeline.clear()
      } else {
        this.timeline = new config.gsap.timeline({ paused: true }) // eslint-disable-line new-cap
        this.timeline.autoRemoveChildren = false
      }

      // create a valid GSAP timeline out of timelines
      this.timelines.each(timeline => {
        if (timeline.type === 'dom') {

          const el = timeline.transformObject

          if (!(el instanceof window.Element)) {
            throw new Error('transformObject is not an Element')
          }

          // kill existing tweens
          config.gsap.tween.killTweensOf(el)
          delete el._gsTransform
          delete el._gsTweenID
          el.setAttribute('style', '')

          // generate new timelines
          this.timeline.add(gsap.generateTimeline(timeline).play(), 0, 'start')
        }
      })

      // update timescale
      this.timeline.timeScale(this.timeScale)
      this._duration = this.timeline.duration()
    } catch (err) {
      throw new Error(`Could not construct timeline: ${err.message}`)
    }

    this.emit('construct', this.timeline)
    return this.timeline
  }

}

Group.fromObject = function(obj) {
  return new Group(obj)
}

export default Group

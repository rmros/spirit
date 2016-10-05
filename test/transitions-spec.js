import Transitions from '../src/group/transitions'
import Transition from '../src/group/transition'

describe('transitions', () => {

  it('should have empty transitions', () => {
    expect(new Transitions()).to.have.lengthOf(0)
  })

  it('should parse array of transitions by objects', () => {
    const trs = new Transitions([{ frame: 0 }, { frame: 12 }, { frame: 49 }])
    expect(trs).to.have.lengthOf(3)
    expect(trs.at(0).toObject(true)).to.deep.equal({ frame: 0, ease: 'Linear.easeNone', params: [] })
    expect(trs.at(1).toObject(true)).to.deep.equal({ frame: 12, ease: 'Linear.easeNone', params: [] })
    expect(trs.at(2).toObject(true)).to.deep.equal({ frame: 49, ease: 'Linear.easeNone', params: [] })
  })

  describe('duplicates', () => {
    it('should not allow duplicate frames', () => {
      expect(() => new Transitions([{ frame: 10 }, { frame: 10 }])).to.throw(/List has duplicates/)
    })
    it('should not allow add duplicate', () => {
      const trs = new Transitions([{ frame: 12 }])
      expect(() => trs.add({frame: 12})).to.throw(/List has duplicates/)
    })
  })

  describe('#toArray', () => {

    let trs

    beforeEach(() => {
      trs = new Transitions([{ frame: 0 }, { frame: 12 }, { frame: 49, params: { x: 200, y: 500 } }])
    })

    it('should convert to object', () => {
      expect(trs.toArray()).to.deep.equal([
        { frame: 0, ease: 'Linear.easeNone', params: {} },
        { frame: 12, ease: 'Linear.easeNone', params: {} },
        { frame: 49, ease: 'Linear.easeNone', params: { x: 200, y: 500 } },
      ])
    })

    it('should convert to object with params as array', () => {
      expect(trs.list.map(tr => tr.toObject(true))).to.deep.equal([
        { frame: 0, ease: 'Linear.easeNone', params: [] },
        { frame: 12, ease: 'Linear.easeNone', params: [] },
        { frame: 49, ease: 'Linear.easeNone', params: [{ x: 200 }, { y: 500 }] },
      ])
    })
  })

  describe('#get', () => {

    let trs

    beforeEach(() => {
      trs = new Transitions([{ frame: 0 }, { frame: 12 }, { frame: 49, params: { x: 200, y: 500 } }])
    })

    it('should get a transition by frame', () => {
      const tr = trs.get(49)
      expect(tr).to.be.an.instanceOf(Transition)
      expect(tr.params.toObject()).to.deep.equal({ x: 200, y: 500 })
    })

    it('should get no transition by frame', () => {
      expect(trs.get(4)).to.be.undefined
      expect(trs.get(13)).to.be.undefined
    })
  })

  describe('#haveFrame', () => {

    let trs

    beforeEach(() => {
      trs = new Transitions([{ frame: 0 }, { frame: 12 }, { frame: 49, params: { x: 200, y: 500 } }])
    })

    it('should have transition with frame', () => {
      expect(trs.haveFrame(12)).to.be.true
    })

    it('should not have a transition with frame', () => {
      expect(trs.haveFrame(13)).to.be.false
    })
  })

  describe('sort', () => {
    let trs

    beforeEach(() => {
      trs = new Transitions([
        { frame: 40 },
        { frame: 2 },
        { frame: 15, params: { x: 200, y: 500 } }
      ])
    })

    it('should have transitions sorted by frame', () => {
      expect(trs.toArray()).to.deep.equal([
        { frame: 2, ease: 'Linear.easeNone', params: {} },
        {
          frame: 15,
          ease: 'Linear.easeNone',
          params: { x: 200, y: 500 }
        },
        { frame: 40, ease: 'Linear.easeNone', params: {} }
      ])
    })

    it('should automatically insert transition by frame', () => {
      trs.add([{ frame: 33 }, { frame: 1 }])
      expect(trs.list.map(tr => tr.frame)).to.deep.equal([1, 2, 15, 33, 40])
    })
  })

  describe('linked transitions', () => {
    let trs

    beforeEach(() => {
      trs = new Transitions([
        { frame: 40 },
        { frame: 2 },
        { frame: 15, params: { x: 200, y: 500 } }
      ])
    })

    it ('should have linked the transitions', () => {
      expect(trs.get(2)).to.have.property('_prev', null)
      expect(trs.get(2)).to.have.property('_next', trs.get(15))

      expect(trs.get(15)).to.have.property('_prev', trs.get(2))
      expect(trs.get(15)).to.have.property('_next', trs.get(40))

      expect(trs.get(40)).to.have.property('_prev', trs.get(15))
      expect(trs.get(40)).to.have.property('_next', null)
    })

  })
})

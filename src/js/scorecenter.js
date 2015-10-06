;(function(){

  const setOptions = function(optionsObject, defaultKeyValues) {

    for (let key in defaultKeyValues) {
      if (!optionsObject.hasOwnProperty(key)) {
        optionsObject[key] = defaultKeyValues[key]
      }
    }

    return optionsObject
  }

  const _increment = function(optionalValue) {
    if (optionalValue === undefined) {
      this.value += 1
      return this.value
    }

    this.value += optionalValue
    return this.value
  }

  const _set = function(value) {
    this.value = value
    return this.value
  }

  const _start = function() {
    if (this.running) {
      return
    }

    this.running = true
    
    if (this.startTime && this.stopTime) {
      this.startTime = +(new Date()) - (this.stopTime - this.startTime)
      this.stopTime = false
      return
    }

    this.startTime = +(new Date())
    this.stopTime = false
  }

  const _stop = function() {
    if (!this.running) {
      return
    }

    this.running = false
    this.stopTime = +(new Date())
  }

  const _reset = function() {
    this.running = false
    this.startTime = this.stopTime = false
  }

  const _setTimer = function(time) {
    if (!this.running) {
      this.stopTime = +(new Date())
    }
    this.startTime = +(new Date()) - time
  }

  const _time = function() {
    if (this.stopTime) {
      return this.stopTime - this.startTime
    }
    return +(new Date()) - (this.startTime || new Date())
  }

  const _displayValueTimer = function() {
    return this.time()
  }

  const _displayValueCounter = function() {
    return this.value
  }

  const initializeMetric = function(metric) {
    let metricObject = {
      name: metric.name,
      type: metric.type || "counter"
    }

    switch(metricObject.type) {
      case "timer":
        metricObject.start = _start.bind(metricObject)
        metricObject.stop = _stop.bind(metricObject)
        metricObject.reset = _reset.bind(metricObject)
        metricObject.set = _setTimer.bind(metricObject)
        metricObject.time = _time.bind(metricObject)
        metricObject.displayValue = _displayValueTimer.bind(metricObject)
        return metricObject

      case "counter":
        metricObject.value = (metric.value || 0)
        metricObject.increment = _increment.bind(metricObject)
        metricObject.set = _set.bind(metricObject)
        metricObject.displayValue = _displayValueCounter.bind(metricObject)
        return metricObject
    }

    return metricObject
  }

  const buildDisplays = function(opts) {
    let $displayContainer = $("<div class='scorecenter js-scorecenter'>")
    $(opts.selector).append($displayContainer)

    return opts.displays.map(function(display){
      let $display = $("<div class='scorecenter-display'>")
      $displayContainer.append($display)

      let $title = $("<div class='scorecenter-displaytitle'>")
      let $value = $("<div class='scorecenter-displayvalue'>")
      $display.append($title)
      $display.append($value)

      let displayObject = {
        format: display.format || (function(value){ 
          return value
        }),

        value: display.value || (function(metricMap) {
          if (display.metric && metricMap[display.metric]) {
            return metricMap[display.metric].displayValue()
          }

          return 0
        }),

        refresh: function() {
          const value = this.value(opts.metricMap)
          const formatted = this.format(value)
          $value.text(formatted)
        }
      }

      $display.addClass(display.className)
      $title.text(display.title || "Unknown Title")

      displayObject.refresh()
      return displayObject
    })
  }

  const Scorecenter = function(selector, opts) {
    opts = setOptions(opts, {
      selector: selector,
      metrics: [],
      displays: [],
      refresh: false
    })

    opts.metrics = opts.metrics.map(initializeMetric)
    opts.metricMap = opts.metrics.reduce(function(mem, metric){
      mem[metric.name] = metric
      return mem
    }, {})

    let displays = buildDisplays(opts)

    let scorecenter = {

      getMetric: function(name) {
        if (!name) {
          return undefined
        }

        return opts.metricMap[name]
      },

      refresh: function() {
        displays.forEach(function(display){
          display.refresh()
        })
      }

    }

    const checkTimeout = function() {
      if (opts.refresh) {
        scorecenter.refresh()
        setTimeout(checkTimeout, opts.refresh)
      }
    }
    checkTimeout()

    return scorecenter
    
  }

  const PackageDefinition = Scorecenter
  const PackageName = "scorecenter"

  if ("undefined" !== typeof(exports)) module.exports = PackageDefinition
  else if ("function" === typeof(define) && define.amd) {
    define(PackageName, function() { return PackageDefinition })
  } else window[PackageName] = PackageDefinition

})()
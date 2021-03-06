/********************************************
 * time-inject:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';

    /**
     * timeInjectNode
     * @param {*} config - configuration
     */
    function timeInjectNode(config) {
        const tInj = {
            none : 0,
            timer : 1,
            interval : 2,
            intervalTime : 4,
            intervalAmount : 5
        };
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeInjectNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (config.injectTypeSelect === 'interval-time') {
            this.injType = tInj.intervalTime;
        } else if (config.injectTypeSelect === 'interval') {
            this.injType = tInj.interval;
        } else if ((config.injectTypeSelect === 'time') && (config.timeType && config.timeType !== 'none')) {
            this.injType = tInj.timer;
        } else if (config.injectTypeSelect === 'interval-amount') {
            this.injType = tInj.intervalAmount;
        } else {
            this.injType = tInj.none;
        }
        this.intervalCount = config.intervalCount ? config.intervalCount : 0;

        if (this.injType === tInj.interval ||
            this.injType === tInj.intervalTime ||
            this.injType === tInj.intervalAmount) {
            this.intervalCountType = (config.intervalCountType || 'num');
        } else {
            this.intervalCountType = 'none';
        }
        this.intervalCountMultiplier = config.intervalCountMultiplier ? config.intervalCountMultiplier : 60000;

        if (this.injType === tInj.intervalTime ||
            this.injType === tInj.intervalAmount ||
            this.injType === tInj.timer) {
            this.timeStartData = {
                type: config.timeType,
                value : config.time,
                offsetType : config.offsetType,
                offset : config.offset || config.timeOffset || 0,
                multiplier : config.offsetMultiplier ? config.offsetMultiplier : (config.timeOffsetMultiplier ? config.timeOffsetMultiplier : 60),
                next : true,
                days : config.timeDays,
                months : config.timeMonths,
                onlyOddDays: config.timeOnlyOddDays,
                onlyEvenDays: config.timeOnlyEvenDays
            };

            if (!this.timeStartData.offsetType) {
                this.timeStartData.offsetType = ((this.timeStartData.offset === 0) ? 'none' : 'num');
            }
            if (this.timeStartData.days === '') {
                throw new Error('No valid days given! Please check settings!');
            }
            if (this.timeStartData.months === '') {
                throw new Error('No valid month given! Please check settings!');
            }
            if (this.timeStartData.onlyEvenDays && this.timeStartData.onlyOddDays) {
                this.timeStartData.onlyEvenDays = false;
                this.timeStartData.onlyOddDays = false;
            }
            if (config.propertyType && config.propertyType !== 'none' && config.timeAltType && config.timeAltType !== 'none') {
                this.property = {
                    type: config.propertyType ? config.propertyType : 'none',
                    value: config.property ? config.property : ''
                };

                if (this.positionConfig && this.property.type === 'jsonata') {
                    try {
                        this.property.expr = this.positionConfig.getJSONataExpression(this, this.property.value);
                    } catch (err) {
                        this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                        this.property.expr = null;
                    }
                }

                if (config.propertyThresholdType && config.propertyThresholdType !== 'none') {
                    this.propertyThreshold = {
                        type: config.propertyThresholdType ? config.propertyThresholdType : 'none',
                        value: config.propertyThreshold ? config.propertyThreshold : ''
                    };
                }
            }
            this.propertyOperator = config.propertyCompare ? config.propertyCompare : 'true';

            if (this.injType === tInj.timer  && this.property && config.timeAltType && config.timeAltType !== 'none') {
                this.timeStartAltData = {
                    type: config.timeAltType ? config.timeAltType : 'none',
                    value : config.timeAlt ? config.timeAlt : '',
                    offsetType : config.timeAltOffsetType,
                    offset : config.timeAltOffset ? config.timeAltOffset : 0,
                    multiplier : config.timeAltOffsetMultiplier ? config.timeAltOffsetMultiplier : 60,
                    next : true,
                    days : config.timeAltDays,
                    months : config.timeAltMonths,
                    onlyOddDays: config.timeAltOnlyOddDays,
                    onlyEvenDays: config.timeAltOnlyEvenDays
                };
                if (!this.timeStartAltData.offsetType) { this.timeStartAltData.offsetType = ((this.timeStartAltData.offset === 0) ? 'none' : 'num'); }

                if (this.timeStartAltData.days === '') {
                    throw new Error('No valid alternate days given! Please check settings!');
                }
                if (this.timeStartAltData.months === '') {
                    throw new Error('No valid alternate month given! Please check settings!');
                }
                if (this.timeStartAltData.onlyEvenDays && this.timeStartAltData.onlyOddDays) {
                    this.timeStartAltData.onlyEvenDays = false;
                    this.timeStartAltData.onlyOddDays = false;
                }
            } // timeAlt
        } // timeStartData

        if (this.injType === tInj.intervalTime ||this.injType === tInj.intervalAmount ) {
            this.timeEndData = {
                type: config.timeEndType,
                value : config.timeEnd,
                offsetType : config.timeEndOffsetType,
                offset : config.timeEndOffset ? config.timeEndOffset : 0,
                multiplier : config.timeEndOffsetMultiplier ? config.timeEndOffsetMultiplier : 60,
                next : true,
                days : config.timeDays,
                months : config.timeMonths,
                onlyOddDays: config.timeOnlyOddDays,
                onlyEvenDays: config.timeOnlyEvenDays
            };
            if (!this.timeEndData.offsetType) {
                this.timeEndData.offsetType = ((this.timeEndData.offset === 0) ? 'none' : 'num');
            }
            if (this.timeEndData.days === '') {
                throw new Error('No valid days given! Please check settings!');
            }
            if (this.timeEndData.months === '') {
                throw new Error('No valid month given! Please check settings!');
            }
            if (this.timeEndData.onlyEvenDays && this.timeEndData.onlyOddDays) {
                this.timeEndData.onlyEvenDays = false;
                this.timeEndData.onlyOddDays = false;
            }
        } // timeEndData

        /* Handle legacy */
        if(!Array.isArray(config.props)){
            config.props = [];
            config.props.push({
                p    : '',
                pt   : 'msgPayload',
                v    : config.payload ? config.payload : '',
                vt   : config.payloadType ? ((config.payloadType === 'string') ? 'str' : config.payloadType) : (config.payload ? 'str' : 'date'),
                o    : config.payloadOffset ? config.payloadOffset : 1,
                oT   : (config.payloadOffset === 0 || config.payloadOffset === '') ? 'none' : (config.payloadOffsetType ? config.payloadOffsetType : 'num'),
                oM   : config.payloadOffsetMultiplier ? config.payloadOffsetMultiplier : 60000,
                f    : config.payloadTimeFormat ? config.payloadTimeFormat : 0,
                next : true,
                days : '*'
            });
            if (config.topic) {
                config.props.push({
                    p    : '',
                    pt   : 'msgTopic',
                    v    : config.topic ? config.topic : '',
                    vt   : 'str',
                    o    : 1,
                    oT   : 'none',
                    oM   : 60000,
                    f    : 0,
                    next : false,
                    days : '*'
                });
            }
            if (typeof config.addPayload1Type !== 'undefined' &&
                typeof config.addPayload1ValueType !== 'undefined' &&
                config.addPayload1Type !== 'none' &&
                config.addPayload1ValueType !== 'none') {
                config.props.push({
                    p    : config.addPayload1,
                    pt   : config.addPayload1Type,
                    v    : config.addPayload1Value,
                    vt   : config.addPayload1ValueType ? ((config.addPayload1ValueType === 'string') ? 'str' : config.addPayload1ValueType) : (config.addPayload1Value ? 'str' : 'date'),
                    o    : config.addPayload1Offset ? config.addPayload1Offset : 1,
                    oT   : (config.addPayload1Offset === 0 || config.addPayload1Offset === '') ? 'none' : (config.addPayload1OffsetType ? config.addPayload1OffsetType : 'num'),
                    oM   : config.addPayload1OffsetMultiplier ? config.addPayload1OffsetMultiplier : 60000,
                    f    : config.addPayload1Format ? config.addPayload1Format : 0,
                    next : false,
                    days : config.addPayload1Days ? config.addPayload1Days : '*'
                });
            }
            if (typeof config.addPayload2Type !== 'undefined' &&
                typeof config.addPayload2ValueType !== 'undefined' &&
                config.addPayload2Type !== 'none' &&
                config.addPayload2ValueType !== 'none') {
                config.props.push({
                    p    : config.addPayload2,
                    pt   : config.addPayload2Type,
                    v    : config.addPayload2Value,
                    vt   : config.addPayload2ValueType ? ((config.addPayload2ValueType === 'string') ? 'str' : config.addPayload2ValueType) : (config.addPayload2Value ? 'str' : 'date'),
                    o    : config.addPayload2Offset ? config.addPayload2Offset : 1,
                    oT   : (config.addPayload2Offset === 0 || config.addPayload2Offset === '') ? 'none' : (config.addPayload2OffsetType ? config.addPayload2OffsetType : 'num'),
                    oM   : config.addPayload2OffsetMultiplier ? config.addPayload2OffsetMultiplier : 60000,
                    f    : config.addPayload2Format ? config.addPayload2Format : 0,
                    next : false,
                    days : config.addPayload2Days ? config.addPayload2Days : '*'
                });
            }
            if (typeof config.addPayload3Type !== 'undefined' &&
                typeof config.addPayload3ValueType !== 'undefined' &&
                config.addPayload3Type !== 'none' &&
                config.addPayload3ValueType !== 'none') {
                config.props.push({
                    p  : config.addPayload3,
                    pt : config.addPayload3Type,
                    v  : config.addPayload3Value,
                    vt : config.addPayload3ValueType ? ((config.addPayload3ValueType === 'string') ? 'str' : config.addPayload3ValueType) : (config.addPayload3Value ? 'str' : 'date'),
                    o  : config.addPayload3Offset ? config.addPayload3Offset : 1,
                    oT : (config.addPayload3Offset === 0 || config.addPayload3Offset === '') ? 'none' : (config.addPayload3OffsetType ? config.addPayload3OffsetType : 'num'),
                    oM : config.addPayload3OffsetMultiplier ? config.addPayload3OffsetMultiplier : 60000,
                    f  : config.addPayload3Format ? config.addPayload3Format : 0,
                    next : false,
                    days : config.addPayload3Days ? config.addPayload3Days : '*'
                });
            }

            delete config.payload;
            delete config.payloadType;
            delete config.payloadTimeFormat;
            delete config.payloadOffset;
            delete config.payloadOffsetType;
            delete config.payloadOffsetMultiplier;
            delete config.topic;
            delete config.addPayload1;
            delete config.addPayload1Type;
            delete config.addPayload1Value;
            delete config.addPayload1ValueType;
            delete config.addPayload1Format;
            delete config.addPayload1Offset;
            delete config.addPayload1OffsetType;
            delete config.addPayload1OffsetMultiplier;
            delete config.addPayload1Next;
            delete config.addPayload1Days;
            delete config.addPayload2;
            delete config.addPayload2Type;
            delete config.addPayload2Value;
            delete config.addPayload2ValueType;
            delete config.addPayload2Format;
            delete config.addPayload2Offset;
            delete config.addPayload2OffsetType;
            delete config.addPayload2OffsetMultiplier;
            delete config.addPayload2Next;
            delete config.addPayload2Days;
            delete config.addPayload3;
            delete config.addPayload3Type;
            delete config.addPayload3Value;
            delete config.addPayload3ValueType;
            delete config.addPayload3Format;
            delete config.addPayload3Offset;
            delete config.addPayload3OffsetType;
            delete config.addPayload3OffsetMultiplier;
            delete config.addPayload3Next;
            delete config.addPayload3Days;
        }

        this.props = [];
        config.props.forEach( prop => {
            const propNew = {
                outType: prop.pt,
                outValue: prop.p,
                type: prop.vt,
                value: prop.v,
                format: prop.f,
                offsetType: prop.oT,
                offset: prop.o,
                multiplier: prop.oM,
                next: (typeof prop.next === 'undefined' || prop.next === null || prop.next === true || prop.next === 'true') ? true : false,
                days: prop.days
            };

            if (this.positionConfig && propNew.type === 'jsonata') {
                try {
                    propNew.expr = this.positionConfig.getJSONataExpression(this, propNew.value);
                } catch (err) {
                    this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                    propNew.expr = null;
                }
            }
            this.props.push(propNew);
        });

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutStartObj = null;
        this.timeOutEndObj = null;
        this.intervalObj = null;
        this.intervalTime = null;
        this.nextStartTime = null;
        this.nextStartTimeAlt = null;
        this.nextEndTime = null;
        const node = this;

        /**
         * get the schedule time
         * @param {Date} time - time to schedule
         * @param {number} [limit] - minimal time limit to schedule
         * @returns {number} milliseconds until the defined Date
         */
        node.tsGetNextScheduleTime = (time, limit) => {
            const dNow = new Date();
            let millisec = time.valueOf() - dNow.valueOf();
            if (limit) {
                while (millisec < limit) {
                    millisec += 86400000; // 24h
                }
            }

            return millisec;
        };

        /**
         * get the limitation for time
         */
        node.getTimeLimitation = dNow => {
            const result = {
                value: null,
                valid : true
            };
            if (config.timedatestart || config.timedateend) {
                const year = dNow.getFullYear();
                if (node.cacheYear !== year) {
                    node.cacheYear = year;
                    if (config.timedatestart) {
                        node.cacheStart = new Date(config.timedatestart);
                        node.cacheStart.setFullYear(year);
                        node.cacheStart.setHours(0, 0, 0, 0);
                    } else {
                        node.cacheStart = new Date(year, 0, 0, 0, 0, 0, 1);
                    }
                    if (config.timedateend) {
                        node.cacheEnd = new Date(config.timedateend);
                        node.cacheEnd.setFullYear(year);
                        node.cacheEnd.setHours(23, 59, 59, 999);
                    } else {
                        node.cacheEnd = new Date(year, 11, 31, 23, 59, 59, 999);
                    }
                }

                if (node.cacheStart < node.cacheEnd) {
                    // in the current year - e.g. 6.4. - 7.8.
                    if (dNow < node.cacheStart || dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear + ((dNow >= node.cacheEnd) ? 1 : 0), node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.errorStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < node.cacheStart && dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear, node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.errorStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                }
            }
            return result;
        };

        node.initializeStartTimer = node => {
            node.debug(`initializeStartTimer`);
            if (!node.timeStartData) {
                node.debug('initializeStartTimer - no start time data');
                return false;
            }

            const dNow = new Date();
            const nowTs = dNow.valueOf();
            const startLimit = node.getTimeLimitation(dNow);
            if (!startLimit.valid) {
                node.debug('initializeStartTimer - start limited');
                return false;
            }
            const initStartData = Object.assign({}, node.timeStartData);
            initStartData.next = false;
            const nextStartTimeData = node.positionConfig.getTimeProp(node, {}, initStartData);
            if (nextStartTimeData.error || !hlp.isValidDate(nextStartTimeData.value)) {
                node.debug(`initializeStartTimer - start time wrong ${ nextStartTimeData.error}`);
                return false;
            }
            let millisec = nextStartTimeData.value.valueOf() - nowTs;

            if (node.timeStartAltData) {
                const initStartAltData = Object.assign({}, node.timeStartAltData);
                initStartAltData.next = false;
                const nextTimeAltData = node.positionConfig.getTimeProp(node, {}, initStartAltData);

                if (!nextTimeAltData.error && hlp.isValidDate(nextTimeAltData.value)) {
                    const millisecAlt = nextTimeAltData.value.valueOf() - nowTs;
                    if (millisecAlt < millisec) {
                        millisec = millisecAlt;
                    }
                }
            }
            if (millisec > 0 || !node.timeEndData) {
                node.debug(`initializeStartTimer - start ${ millisec } in future or no end time`);
                return false;
            }
            const initEndTime = Object.assign({},node.timeEndData);
            initEndTime.next = false;
            const nextEndTimeData = node.positionConfig.getTimeProp(node, {}, initEndTime);
            if (nextEndTimeData.error || !hlp.isValidDate(nextEndTimeData.value)) {
                node.debug(`initializeStartTimer - end time error ${ nextEndTimeData.error }`);
                return false;
            }
            const millisecEnd = (nextEndTimeData.value.valueOf() - nowTs);
            if (millisecEnd < 0) {
                node.debug(`initializeStartTimer - end time ${ millisecEnd } in past`);
                return false;
            }
            node.debug(`initializeStartTimer - starting interval!!`);

            if (this.injType === tInj.intervalTime) {
                node.getIntervalTime();
                node.doStartInterval(); // starte Interval
            } else if (node.injType === tInj.intervalAmount) {
                node.IntervalCountMax = node.positionConfig.getFloatProp(node, null, node.intervalCountType, node.intervalCount, 0);
                node.intervalTime = Math.floor((millisecEnd - millisec) / node.IntervalCountMax);
                node.IntervalCountCurrent = 0;
                node.doStartInterval(); // starte Interval
            }
            return true;
        };

        node.initialize = (node, doEmit) => {
            node.debug(`initialize`);
            switch (node.injType) {
                case tInj.interval:
                    if (doEmit) {
                        node.emit('input', {
                            type: 'once/startup'
                        }); // will create timeout
                    }
                    node.debug('initialize - absolute Intervall');
                    node.getIntervalTime();
                    clearInterval(node.intervalObj);
                    node.status({
                        text: '↻' + Math.round(((node.intervalTime / 1000) + Number.EPSILON) * 10) / 10 + 's'
                    });
                    node.send(node.prepOutMsg({ type: 'interval-start' }));
                    node.intervalObj = setInterval(() => {
                        node.send(node.prepOutMsg({ type: 'interval' }));
                    }, node.intervalTime);
                    break;
                case tInj.timer:
                    node.debug('initialize - timer');
                    if (doEmit) {
                        node.emit('input', {
                            type: 'once/startup'
                        }); // will create timeout
                    } else {
                        node.doCreateStartTimeout(node);
                    }
                    break;
                case tInj.intervalTime:
                case tInj.intervalAmount:
                    if (doEmit) {
                        node.emit('input', {
                            type: 'once/startup'
                        });
                    }
                    if (!node.initializeStartTimer(node)) {
                        node.doCreateStartTimeout(node);
                    }
                    break;
            }
        };

        /**
         * get the end time in millisecond
         * @param {*} node the node Data
         */
        node.getMillisecEnd = node => {
            if (!node.timeEndData) {
                return null;
            }
            node.debug(`doCreateEndTimeout node.timeEndData=${util.inspect(node.timeEndData, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (node.timeOutEndObj) {
                clearTimeout(node.timeOutEndObj);
                node.timeOutEndObj = null;
            }
            const nextEndTimeData = node.positionConfig.getTimeProp(node, {}, node.timeEndData);
            if (nextEndTimeData.error) {
                node.nextEndTime = null;
                node.debug('nextEndTimeData=' + util.inspect(nextEndTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                node.error(nextEndTimeData.error);
                return null;
            }
            node.nextEndTime = nextEndTimeData.value;

            let millisecEnd = 1000 * 60 * 60 * 24; // 24h
            if ((node.nextEndTime !== null) && (typeof node.nextEndTime !== 'undefined')) {
                // node.debug('timeout ' + node.nextEndTime + ' is in ' + millisec + 'ms');
                millisecEnd = node.tsGetNextScheduleTime(node.nextEndTime, 10);
            }
            return millisecEnd;
        };

        /**
         * creates the end timeout
         * @param {*} node - the node representation
         * @returns {object} state or error
         */
        node.doCreateEndTimeout = (node, millisecEnd) => {
            millisecEnd = millisecEnd || node.getMillisecEnd(node);
            if (millisecEnd === null) {
                return;
            }

            if (millisecEnd > 345600000) {
                millisecEnd = Math.min((millisecEnd - 129600000), 2147483646);
                node.timeOutEndObj = setTimeout(() => {
                    node.doCreateEndTimeout(node);
                }, millisecEnd); // 1,5 days before
                return;
            }
            node.timeOutEndObj = setTimeout(() => {
                node.timeOutEndObj = null;
                clearInterval(node.intervalObj);
                node.intervalObj = null;
                node.doCreateStartTimeout(node);
            }, millisecEnd);
        }; // doCreateEndTimeout

        /**
         * Recalculate the Start timeout
         */
        node.doRecalcStartTimeOut = () => {
            try {
                node.debug('performing a recalc of the next inject time');
                node.doCreateStartTimeout(node);
            } catch (err) {
                node.error(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        };

        /**
         * Prepaes a message object for sending
         */
        node.prepOutMsg = msg => {
            // node.debug(`prepOutMsg node.msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
            const dNow = new Date();
            for (let i = 0; i < node.props.length; i++) {
                // node.debug(`prepOutMsg-${i} node.props[${i}]=${util.inspect(node.props[i], { colors: true, compact: 10, breakLength: Infinity })}`);
                const res = node.positionConfig.getOutDataProp(this, msg, node.props[i], dNow);
                if (res === null || (typeof res === 'undefined')) {
                    this.error('Could not evaluate ' + node.props[i].type + '.' + node.props[i].value + '. - Maybe settings outdated (open and save again)!');
                } else if (res.error) {
                    this.error('Error on getting additional payload: "' + res.error + '"');
                } else {
                    node.positionConfig.setMessageProp(this, msg, node.props[i].outType, node.props[i].outValue, res);
                }
                // node.debug(`prepOutMsg-${i} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
            }
            msg._srcid = node.id;
            msg._ts = dNow.valueOf();
            return msg;
        };

        /**
         * get and validate a given interval
         */
        node.getIntervalTime = () => {
            node.intervalTime = node.positionConfig.getFloatProp(node, null, node.intervalCountType, node.intervalCount, 0);
            if (node.intervalTime <= 0) {
                throw new Error('Interval wrong!');
            } else {
                if (node.intervalCountMultiplier > 0) {
                    node.intervalTime = Math.floor(node.intervalTime * node.intervalCountMultiplier);
                }
            }
        };

        /**
         * start an Intervall
         */
        node.doStartInterval = () => {
            node.timeOutStartObj = null;
            node.doCreateEndTimeout(node);
            clearInterval(node.intervalObj);
            node.doSetStatus(node, 'green');
            node.send(node.prepOutMsg({ type: 'interval-time-start' }));
            node.intervalObj = setInterval(() => {
                node.IntervalCountCurrent++;
                if (node.IntervalCountMax < 1) {
                    node.send(node.prepOutMsg({ type: 'interval-time' }));
                } else if (node.IntervalCountCurrent < node.IntervalCountMax) {
                    node.send(node.prepOutMsg({ type: 'interval-amount' }));
                }
            }, node.intervalTime);
        };

        /**
         * creates the timeout
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @returns {object} state or error
         */
        node.doCreateStartTimeout = node => {
            node.debug(`doCreateStartTimeout node.timeStartData=${util.inspect(node.timeStartData, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (node.injType === tInj.none ||
                node.injType === tInj.interval) {
                return;
            }

            node.nextStartTime = null;
            node.nextStartTimeAlt = null;

            if (node.timeOutStartObj) {
                clearTimeout(node.timeOutStartObj);
                node.timeOutStartObj = null;
            }
            delete node.intervalTime;

            if (node.injType === tInj.intervalTime) {
                node.IntervalCountMax = 0;
                node.getIntervalTime();
            }

            if (node.injType === tInj.intervalAmount) {
                node.IntervalCountMax = node.positionConfig.getFloatProp(node, null, node.intervalCountType, node.intervalCount, 0);
                delete node.intervalTime;
            }

            let fill = 'yellow';
            let shape = 'dot';

            node.timeStartData.isAltAvailable = false;
            node.timeStartData.isAltFirst = false;
            let isFixedTime = true;

            node.timeStartData.now = new Date();
            const startLimit = node.getTimeLimitation(node.timeStartData.now);
            if (startLimit.valid) {
                node.debug(`node.timeStartData=${util.inspect(node.timeStartData, { colors: true, compact: 10, breakLength: Infinity })}`);
                const nextStartTimeData = node.positionConfig.getTimeProp(node, {}, node.timeStartData);
                if (nextStartTimeData.error) {
                    node.debug('node.nextStartTimeData=' + util.inspect(nextStartTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    hlp.handleError(node, nextStartTimeData.error, null, 'could not evaluate time');
                    return;
                }
                node.nextStartTime = nextStartTimeData.value;
                isFixedTime = isFixedTime && nextStartTimeData.fix;


                if (node.timeStartAltData) {
                    node.timeStartAltData.now = node.timeStartData.now;
                    node.debug(`node.timeStartAltData=${util.inspect(node.timeStartAltData, { colors: true, compact: 10, breakLength: Infinity })}`);
                    const nextTimeAltData = node.positionConfig.getTimeProp(node, {}, node.timeStartAltData);

                    if (nextTimeAltData.error) {
                        isFixedTime = false;
                        node.debug('nextTimeAltData=' + util.inspect(nextTimeAltData, { colors: true, compact: 10, breakLength: Infinity }));
                        hlp.handleError(node, nextTimeAltData.error, null, 'could not evaluate alternate time');
                        return;
                    }
                    node.nextStartTimeAlt = nextTimeAltData.value;
                    isFixedTime = isFixedTime && nextTimeAltData.fix;
                    if (!hlp.isValidDate(node.nextStartTimeAlt)) {
                        hlp.handleError(this, 'Invalid time format of alternate time "' + node.nextStartTimeAlt + '"', undefined, 'internal error!');
                    } else {
                        node.timeStartData.isAltAvailable = true;
                    }
                }
            } else {
                hlp.handleError(this, startLimit.errorStatus);
                return;
            }

            if (node.nextStartTime) {
                if (!hlp.isValidDate(node.nextStartTime)) {
                    hlp.handleError(this, 'Invalid time format "' + node.nextStartTime + '"', undefined, 'internal error!');
                    return;
                }

                let millisec = node.tsGetNextScheduleTime(node.nextStartTime, 10);
                if (node.timeStartData.isAltAvailable) {
                    shape = 'ring';
                    const millisecAlt = node.tsGetNextScheduleTime(node.nextStartTimeAlt, 10);
                    if (millisecAlt < millisec) {
                        millisec = millisecAlt;
                        node.timeStartData.isAltFirst = true;
                    }
                }

                if (millisec > 345600000) {
                    // > 4 Days
                    if (node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                    // there is a limitation of nodejs that the maximum setTimeout time
                    // should not more then 2147483647 ms (24.8 days).
                    millisec = Math.min((millisec - 129600000), 2147483646);
                    node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms');
                    node.timeOutStartObj = setTimeout(() => {
                        node.doRecalcStartTimeOut();
                    }, millisec); // 1,5 days before
                    fill = 'blue';
                } else if (this.injType === tInj.intervalTime) {
                    node.debug('intervalTime - timeout ' + node.nextStartTime + ' is in ' + millisec + 'ms (isAlt=' + node.timeStartData.isAltAvailable + ' isAltFirst=' + node.timeStartData.isAltFirst + ')');
                    node.timeOutStartObj = setTimeout(node.doStartInterval, millisec);
                    fill = 'grey';
                } else if (this.injType === tInj.intervalAmount) {
                    node.debug('intervalAmount - timeout ' + node.nextStartTime + ' is in ' + millisec + 'ms (isAlt=' + node.timeStartData.isAltAvailable + ' isAltFirst=' + node.timeStartData.isAltFirst + ')');
                    const millisecEnd = node.getMillisecEnd(node);
                    node.intervalTime = Math.floor((millisecEnd - millisec) / node.IntervalCountMax);
                    node.IntervalCountCurrent = 0;
                    node.timeOutStartObj = setTimeout(node.doStartInterval, millisec);
                    fill = 'grey';
                } else { // this.injType === tInj.timer
                    node.debug('timeout ' + node.nextStartTime + ' is in ' + millisec + 'ms (isAlt=' + node.timeStartData.isAltAvailable + ' isAltFirst=' + node.timeStartData.isAltFirst + ')');
                    node.timeOutStartObj = setTimeout(() => {
                        // node.debug(`timeOutStartObj isAlt=${isAlt} isAltFirst=${node.timeStartData.isAltFirst}`);

                        const msg = {
                            type: 'start',
                            timeData: {}
                            // settingData: node.timeStartData,
                            // settingDataAlt: node.timeStartAltData
                        };
                        node.timeOutStartObj = null;
                        let useAlternateTime = false;
                        if (node.timeStartData.isAltAvailable) {
                            let needsRecalc = false;
                            try {
                                useAlternateTime = node.positionConfig.comparePropValue(node, msg, node.property, node.propertyOperator, node.propertyThreshold);
                                needsRecalc = (node.timeStartData.isAltFirst && !useAlternateTime) || (!node.timeStartData.isAltFirst && useAlternateTime);
                                // node.debug(`timeOutStartObj isAltAvailable=${node.timeStartData.isAltAvailable} isAltFirst=${node.timeStartData.isAltFirst} needsRecalc=${needsRecalc}`);

                            } catch (err) {
                                needsRecalc = node.timeStartData.isAltFirst;
                                hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', node.property),  err);
                            }

                            if (needsRecalc) {
                                // node.debug(`doTimeRecalc, no send message!`);
                                node.doRecalcStartTimeOut();
                                return;
                            }
                        }

                        // node.debug(`usenormalTime!`);
                        node.emit('input', msg);
                    }, millisec);
                    fill = 'green';

                    if (!isFixedTime && !node.intervalObj) {
                        node.intervalObj = setInterval(() => {
                            node.debug('retriggered');
                            node.doCreateStartTimeout(node);
                        }, node.recalcTime);
                    } else if (isFixedTime && node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                }
            }
            node.doSetStatus(node, fill, shape);
        };

        node.doSetStatus = (node, fill, shape) => {
            if (node.nextStartTimeAlt && node.timeOutStartObj) {
                if (node.timeStartData.isAltFirst) {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextStartTimeAlt) + ' / ' + node.positionConfig.toTimeString(node.nextStartTime)
                    });
                } else {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextStartTime) + ' / ' + node.positionConfig.toTimeString(node.nextStartTimeAlt)
                    });
                }
            } else if (node.nextStartTime && node.timeOutStartObj) {
                let txt = node.positionConfig.toDateTimeString(node.nextStartTime);
                if (node.nextEndTime) {
                    txt += ' - ';
                    txt += node.positionConfig.toDateTimeString(node.nextEndTime);
                }
                if (node.intervalTime) {
                    txt += ' ↻';
                    txt += Math.round(((node.intervalTime / 1000) + Number.EPSILON) * 10) / 10;
                    txt += 's';
                }
                node.status({
                    fill,
                    shape,
                    text: txt
                });
            } else if (node.intervalTime) {
                let txt = '↻' + Math.round(((node.intervalTime / 1000) + Number.EPSILON) * 10) / 10 + 's';
                if (node.nextEndTime) {
                    txt += ' -> ';
                    txt += node.positionConfig.toDateTimeString(node.nextEndTime);
                }
                node.status({
                    fill,
                    shape,
                    text: txt
                });
            } else {
                node.status({});
            }
        };

        this.on('input', (msg, send, done) => { // eslint-disable-line complexity
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug('--------- time-inject - input (type=' + msg.type + ')');
                if (!node.positionConfig) {
                    throw new Error('configuration missing!');
                }
                if (node.injType === tInj.timer) {
                    node.doCreateStartTimeout(node);
                }
                send(node.prepOutMsg(msg));
                if (msg.payload === null || (typeof msg.payload === 'undefined')) {
                    done('could not evaluate ' + config.payloadType + '.' + config.payload);
                } else if (msg.payload.error) {
                    done('could not getting payload: ' + msg.payload.error);
                } else {
                    done();
                }
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                done('internal error time-inject:' + err.message, msg);
            }
            return null;
        });

        node.status({});
        try {
            if (!node.positionConfig) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')
                });
                return;
            }
            if (config.once) {
                if (config.onceDelay > 2147483) {
                    config.onceDelay = 2147483;
                }
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: RED._('time-inject.message.onceDelay', { seconds: (config.onceDelay || 0.1)})
                });
                node.onceTimeout = setTimeout(() => {
                    try {
                        node.initialize(node, true);
                    } catch (err) {
                        node.error(err.message);
                        node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                        });
                    }
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            node.onceTimeout = setTimeout(() => {
                try {
                    node.initialize(node, false);
                } catch (err) {
                    node.error(err.message);
                    node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                    node.status({
                        fill: 'red',
                        shape: 'ring',
                        text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                    });
                }
            }, 400 + Math.floor(Math.random() * 600));
        } catch (err) {
            node.error(err.message);
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
            });
        }
    }

    RED.nodes.registerType('time-inject', timeInjectNode);

    timeInjectNode.prototype.close = function () {
        if (this.onceTimeout) {
            clearTimeout(this.onceTimeout);
            this.onceTimeout = null;
        }
        if (this.onceTimeout2) {
            clearTimeout(this.onceTimeout2);
            this.onceTimeout2 = null;
        }
        if (this.timeOutStartObj) {
            clearTimeout(this.timeOutStartObj);
            this.timeOutStartObj = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
        if (this.intervalObj) {
            clearInterval(this.intervalObj);
            this.intervalObj = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
        if (this.timeOutEndObj) {
            clearTimeout(this.timeOutEndObj);
            this.timeOutEndObj = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
    };

    RED.httpAdmin.post('/time-inject/:id', RED.auth.needsPermission('time-inject.write'), (req,res) => {
        const node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== 'undefined') {
            try {
                node.receive();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._('node-red:inject.failed',{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });
};
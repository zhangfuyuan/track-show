var Utils = {
  /**
   *	function: 根据时间戳格式化时间为 年-月-日 时:分:秒
   *	params:   time，时间戳，日期（必传）
   *            fmt，格式化字符模板，字符串（非必传，默认 'yyyy-MM-dd hh:mm:ss'）
   *	return:   字符串
   */
  formatTime: function(time, fmt) {
    var date = new Date(time);

    if (!fmt) {
      fmt = 'yyyy-MM-dd hh:mm:ss';
    }

    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    var o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds()
    }

    for (var k in o) {
      if (o.hasOwnProperty(k) === true) {
        var str = o[k] + '';

        if (new RegExp('(' + k + ')').test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : this.padLeftZero(str));
        }
      }
    }
    return fmt;
  },

  // 补零
  padLeftZero: function(str) {
    return ('00' + str).substr(str.length);
  },

  // 数字转三位数用符号 , 隔开
  toThousandslsFilter: function(num) {
    return (+num || 0).toString().replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ','));
  },
}

var Page = {
  // 当前是否正在加载
  isLoading: false,

  // 页面初始化
  init: function() {
    var nowDate = Date.now();

    $('#beginDate').val(Utils.formatTime(nowDate - 1000 * 60 * 60 * 24 * 7, 'yyyy-MM-dd'));
    $('#endDate').val(Utils.formatTime(nowDate, 'yyyy-MM-dd'));
    this.allRefreshFn();
    $('#functionBoxBody, #widgetBoxBody, #officeDeviceBoxBody').niceScroll({
      cursorcolor: "#ccc",
      background: "transparent",
      cursorwidth: "8px",
      autohidemode: "leave",
      horizrailenabled: false,
      zindex: 998,
      boxzoom: false,
      oneaxismousemode: false,
      nativeparentscrolling: true,
    });
  },

  // 刷新全部数据
  allRefreshFn: function() {
    var self = this;

    $.when(self.refreshFunctionFn()).then(function() {
      $.when(self.refreshWidgetFn()).then(function() {
        $.when(self.refreshProgramStoreFn()).then(function() {
          $.when(self.refreshDeviceFn()).then(function() {
            $.when(self.refreshOfficeDeviceFn()).then(function() {
              $.when(self.refreshActiveUserFn()).then(function() {
                $.when(self.refreshDeviceUserFn()).then(function() {
                  $.when(self.refreshDeviceActiveUserFn()).then(function() {
                    console.log('全部加载完成');
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  // 刷新发布系统各个功能的使用频率
  refreshFunctionFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/function.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          if (res.data.length > 0) {
            var html = '';

            $.each(res.data.sort(function(a, b) {
              return b.num - a.num;
            }), function(index, item) {
              html += '<tr>' +
                '<td>' + item.uri + '</td>' +
                '<td>' + item.tag + '</td>' +
                '<td>' + Utils.toThousandslsFilter(item.num) + '</td>' +
                '</tr>';
            });
            $('#functionBoxTbody').empty().append(html);
            $("#functionBoxBody").getNiceScroll().resize();
          } else {
            $('#functionBoxTbody').empty().append(
              '<tr><td colspan="3" style="text-align: center;">暂无数据</td></tr>');
          }
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新节目控件使用频率
  refreshWidgetFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/widget.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          if (res.data.length > 0) {
            var html = '';

            $.each(res.data.sort(function(a, b) {
              return b.num - a.num;
            }), function(index, item) {
              html += '<tr>' +
                '<td>' + item.type + '</td>' +
                '<td>' + Utils.toThousandslsFilter(item.relatedProgramsNum) + '</td>' +
                '<td>' + Utils.toThousandslsFilter(item.num) + '</td>' +
                '</tr>';
            });
            $('#widgetBoxTbody').empty().append(html);
            $("#widgetBoxBody").getNiceScroll().resize();
          } else {
            $('#widgetBoxTbody').empty().append(
              '<tr><td colspan="3" style="text-align: center;">暂无数据</td></tr>');
          }
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新节目大小分布曲线
  refreshProgramStoreFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/programStore.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          Highcharts.chart('programStoreChart', {
            chart: {
              type: 'spline'
            },
            title: {
              text: null
            },
            xAxis: {
              title: {
                text: '节目大小'
              },
              categories: ['[0,1MB]', '(1MB,10MB]', '(10MB,50MB]', '(50MB,100MB]', '(100MB,500MB]',
                '(500MB,800MB]', '(800MB,1GB]', '(1GB,+∞)'
              ]
            },
            yAxis: {
              title: {
                text: '节目个数'
              }
            },
            tooltip: {
              crosshairs: true,
              shared: true
            },
            legend: {
              enabled: false
            },
            plotOptions: {
              spline: {
                marker: {
                  radius: 4,
                  lineColor: '#666666',
                  lineWidth: 1
                }
              }
            },
            series: [{
              name: '该大小区间的节目个数',
              marker: {
                symbol: 'diamond'
              },
              data: (function(data) {
                return ['le1', 'le2', 'le3', 'le4', 'le5', 'le6', 'le7', 'le8'].map(function(item) {
                  return data && data[item] || 0;
                });
              })(res.data),
              color: '#4ecb72',
            }],
            credits: {
              enabled: false
            },
            exporting: {
              enabled: false
            },
          });
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新分周期统计新接入设备数量、活跃设备占比
  refreshDeviceFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/device.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          $('#newDeviceBeginDate').text($('#beginDate').val());
          $('#newDeviceEndDate').text($('#endDate').val());
          $('#newDeviceNum').text(Utils.toThousandslsFilter(res.data));
        }

        $.ajax({
          url: './data/device2.json?t=' + Date.now(),
          type: 'GET',
          dataType: 'json',
          data: {
            beginDate: $('#beginDate').val(),
            endDate: $('#endDate').val(),
          }
        }).done(function(r) {
          if (r.errcode == 0) {
            var activeProportion = parseFloat(r.data);

            Highcharts.chart('activeDeviceChart', {
              chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
              },
              title: {
                text: '活跃设备占比'
              },
              tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
              },
              plotOptions: {
                pie: {
                  allowPointSelect: true,
                  cursor: 'pointer',
                  showInLegend: true,
                  dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                      color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                  }
                }
              },
              series: [{
                name: '占比',
                colorByPoint: true,
                data: [{
                  name: '活跃设备',
                  y: activeProportion,
                  sliced: true,
                  selected: true,
                  color: '#4ecb72',
                }, {
                  name: '非活跃设备',
                  y: 100 - activeProportion,
                  color: '#ccc',
                }],
              }],
              credits: {
                enabled: false
              },
              exporting: {
                enabled: false
              },
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新一级机构终端接入数排名及变化趋势
  refreshOfficeDeviceFn: function(id) {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/officeDevice.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
        officeId: id || '',
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          var curOffice = '';
          var resData = res.data;

          if (resData.rankings.length > 0) {
            var html = '';
            var rankList = resData.rankings;

            $.each(rankList.sort(function(a, b) {
              return b.terminalTotal - a.terminalTotal;
            }), function(index, item) {
              var isActive = item.officeId === id;

              html += '<tr class="' + (isActive ? 'active' : '') + '" title="' + (isActive ? '当前机构' :
                  '点击查看该机构变化趋势') + '" onclick="Page.refreshHandle(\'refreshOfficeDeviceFn\', \'' + item.officeId +
                '\');">' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + item.officeName + '</td>' +
                '<td>' + Utils.toThousandslsFilter(item.terminalTotal) + '</td>' +
                '</tr>';

              if (isActive) curOffice = item.officeName;
            });
            $('#officeDeviceBoxTbody').empty().append(html);
            $("#officeDeviceBoxBody").getNiceScroll().resize();
            rankList = null;
          } else {
            $('#officeDeviceBoxTbody').empty().append(
              '<tr><td colspan="3" style="text-align: center;">暂无数据</td></tr>');
          }

          if (resData.trends) {
            var trendList = resData.trends;
            var endDate = $('#endDate').val();

            Highcharts.chart('officeDeviceChart', {
              chart: {
                zoomType: 'x'
              },
              title: {
                text: (curOffice || '全部') + '机构的终端接入数变化趋势'
              },
              subtitle: {
                text: document.ontouchstart === undefined ? '鼠标拖动可以进行缩放' : '手势操作进行缩放'
              },
              xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: {
                  millisecond: '%H:%M:%S.%L',
                  second: '%H:%M:%S',
                  minute: '%H:%M',
                  hour: '%H:%M',
                  day: '%m-%d',
                  week: '%m-%d',
                  month: '%Y-%m',
                  year: '%Y'
                }
              },
              tooltip: {
                dateTimeLabelFormats: {
                  millisecond: '%H:%M:%S.%L',
                  second: '%H:%M:%S',
                  minute: '%H:%M',
                  hour: '%H:%M',
                  day: '%Y-%m-%d',
                  week: '%m-%d',
                  month: '%Y-%m',
                  year: '%Y'
                }
              },
              yAxis: {
                title: {
                  text: '终端接入数（台）'
                }
              },
              legend: {
                enabled: false
              },
              plotOptions: {
                area: {
                  fillColor: {
                    linearGradient: {
                      x1: 0,
                      y1: 0,
                      x2: 0,
                      y2: 1
                    },
                    stops: [
                      [0, '#4ecb72'],
                      [1, new Highcharts.Color('#4ecb72').setOpacity(0).get('rgba')]
                    ]
                  },
                  marker: {
                    radius: 2
                  },
                  lineWidth: 1,
                  states: {
                    hover: {
                      lineWidth: 1
                    }
                  },
                  threshold: null
                }
              },
              series: [{
                type: 'area',
                name: '终端接入数',
                data: (function(list, date) {
                  var t = new Date(date).getTime();
                  var len = list.length;
                  var day = 1000 * 60 * 60 * 24;

                  return list.map(function(item, index) {
                    return [t - day * (len - 1 - index), item];
                  });
                })(trendList, endDate),
                color: '#4ecb72',
              }],
              credits: {
                enabled: false
              },
              exporting: {
                enabled: false
              },
            });

            trendList = null;
          }

          resData = null;
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新根据活跃度区间，统计活跃用户数量
  refreshActiveUserFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/activeUser.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          Highcharts.chart('activeUserChart', {
            chart: {
              type: 'column'
            },
            title: {
              text: null
            },
            xAxis: {
              title: {
                text: '活跃度'
              },
              categories: ['[0,1)', '[1,10)', '[10,50)', '[50,100)', '[100,300)', '[300,600)', '[600,1000)',
                '[1000,1200)', '[1200,1600)', '[1600,+∞)'
              ],
              labels: {
                rotation: -45
              }
            },
            yAxis: {
              min: 0,
              title: {
                text: '用户量（位）'
              }
            },
            legend: {
              enabled: false
            },
            tooltip: {
              pointFormat: '该活跃区间的用户量: <b>{point.y}</b>'
            },
            series: [{
              name: '活跃度',
              data: (function(data) {
                return ['le1', 'le2', 'le3', 'le4', 'le5', 'le6', 'le7', 'le8', 'le9', 'le10'].map(
                  function(item) {
                    return data && data[item] || 0;
                  });
              })(res.data),
              dataLabels: {
                enabled: true,
                rotation: -90,
                color: '#FFFFFF',
                align: 'right',
                format: '{point.y}',
                y: 10
              },
              // color: '#4ecb72',
              // colors: ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
            }],
            credits: {
              enabled: false
            },
            exporting: {
              enabled: false
            },
          });
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新根据终端量区间，统计用户量
  refreshDeviceUserFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/deviceUser.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          Highcharts.chart('deviceUserChart', {
            chart: {
              type: 'lollipop'
            },
            accessibility: {
              point: {
                descriptionFormatter: function(point) {
                  var ix = point.index + 1,
                    x = point.name,
                    y = point.y;
                  return ix + '. ' + x + ', ' + y + '.';
                }
              }
            },
            legend: {
              enabled: false
            },
            title: {
              text: null
            },
            tooltip: {
              shared: true
            },
            xAxis: {
              title: {
                text: '终端量（台）'
              },
              categories: ['[0,1)', '[1,10)', '[10,50)', '[50,100)', '[100,300)', '[300,600)', '[600,1000)',
                '[1000,1200)', '[1200,1600)', '[1600,2000)', '[2000,2500)', '[2500,3000)', '[3000,5000)',
                '[5000,7500)', '[7500,10000)', '[10000,15000)', '[15000,20000)', '[20000,30000)',
                '[30000,60000)', '[60000,+∞)'
              ],
            },
            yAxis: {
              min: 0,
              title: {
                text: '用户量（位）'
              }
            },
            series: [{
              name: '该终端量区间的用户量',
              data: (function(data) {
                return ['le1', 'le2', 'le3', 'le4', 'le5', 'le6', 'le7', 'le8', 'le9', 'le10',
                  'le11', 'le12', 'le13', 'le14', 'le15', 'le16', 'le17', 'le18', 'le19', 'le20'
                ].map(
                  function(item) {
                    return data && data[item] || 0;
                  });
              })(res.data),
              color: '#2b908f',
            }],
            credits: {
              enabled: false
            },
            exporting: {
              enabled: false
            },
          });
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 刷新终端增长，终端总量跟用户活跃度、大/小客户的对照
  refreshDeviceActiveUserFn: function() {
    var self = this,
      dfd = new $.Deferred();

    self.isLoading = true;
    $.ajax({
      url: './data/deviceActiveUser.json?t=' + Date.now(),
      type: 'GET',
      dataType: 'json',
      data: {
        beginDate: $('#beginDate').val(),
        endDate: $('#endDate').val(),
      }
    }).done(function(res) {
      try {
        if (res.errcode == 0) {
          $.ajax({
            url: './data/deviceActiveUser2.json?t=' + Date.now(),
            type: 'GET',
            dataType: 'json',
            data: {
              beginDate: $('#beginDate').val(),
              endDate: $('#endDate').val(),
            }
          }).done(function(r) {
            if (r.errcode == 0) {
              var growthColor = '#f5692b',
                totalColor = '#fac5ad',
                categoriesData = [],
                seriesData = [{
                  name: '终端总量',
                  data: [],
                  color: totalColor,
                }, {
                  name: '终端增长',
                  data: [],
                  color: growthColor,
                }],
                tmpMap = ['AD[0,1)', 'AD[1,10)', 'AD[10,50)', 'AD[50,100)', 'AD[100,300)', 'AD[300,600)',
                  'AD[600,1000)', 'AD[1000,1200)', 'AD[1200,1600)', 'AD[1600,+∞)', '小客户', '大客户'
                ].map(function(item, index) {
                  var _item = {
                    category: item,
                    growth: 0,
                    total: 0,
                    old: 0,
                  };

                  if (index < 10) {
                    _item.growth = res.data && res.data.terminalGrowth && res.data.terminalGrowth[index] ||
                      0;
                    _item.total = res.data && res.data.terminalTotal && res.data.terminalTotal[index] ||
                      0;
                  } else {
                    _item.growth = r.data && r.data.terminalGrowth && r.data.terminalGrowth[index - 10] ||
                      0;
                    _item.total = r.data && r.data.terminalTotal && r.data.terminalTotal[index - 10] || 0;
                  }

                  _item.old = _item.total - _item.growth;
                  return _item;
                }).sort(function(a, b) {
                  return b.total - a.total;
                });

              $.each(tmpMap, function(index, item) {
                seriesData[0].data.push(item.old);
                seriesData[1].data.push(item.growth);
                categoriesData.push(item.category);
              });

              Highcharts.chart('deviceActiveUserChart', {
                chart: {
                  type: 'bar',
                },
                title: {
                  text: null
                },
                tooltip: {
                  pointFormatter: function() { // 返回格式化提示框中该点的HTML代码（不影响x轴文字的显示）
                    if (this.color === totalColor) { // 根据颜色值区分，全部则显示总值
                      return '<span style="color:' + this.color + '">\u25CF</span> ' + this.series.name +
                        ': <b>' + Highcharts.numberFormat(this.total, 0, '.', ',') + '</b><br/>';
                    } else { // 共享仅显示其值
                      return '<span style="color:' + this.color + '">\u25CF</span> ' + this.series.name +
                        ': <b>' + Highcharts.numberFormat(this.y, 0, '.', ',') + '</b><br/>';
                    }
                  }
                },
                xAxis: {
                  categories: categoriesData
                },
                yAxis: {
                  min: 0,
                  title: {
                    text: '终端量（台）'
                  }
                },
                legend: {
                  reversed: true,
                },
                plotOptions: {
                  series: {
                    stacking: 'normal',
                    events: {
                      legendItemClick: function(e) {
                        return false;
                      }
                    }
                  },
                  bar: {
                    borderWidth: 0
                  }
                },
                series: seriesData,
                credits: {
                  enabled: false
                },
                exporting: {
                  enabled: false
                }
              });
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    }).always(function() {
      self.isLoading = false;
      dfd.resolve();
    });

    return dfd.promise();
  },

  // 点击刷新
  refreshHandle(fn) {
    if (this.isLoading === false && typeof(this[fn]) === 'function') {
      var params = Array.prototype.slice.call(arguments).slice(1);

      this[fn].apply(this, params);
    }
  },

};

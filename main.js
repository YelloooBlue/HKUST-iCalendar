import { extractCoursesJson } from './scheduleToJson.js';

document.getElementById("extractBtn").addEventListener("click", extractCourses);
document.getElementById("downloadBtn").addEventListener("click", downloadCourses);

var coursesInfo = [];
var classesInfo = [];
var icsContent = "";

function extractCourses() {

    console.log("Extracting courses...");
    coursesInfo = extractCoursesJson();
    console.log(coursesInfo);

    //show
    var coursesUl = document.getElementById("courses");
    coursesUl.innerHTML = "";
    for (var i = 0; i < coursesInfo.length; i++) {

        var courseInfo = coursesInfo[i];

        var courseLi = document.createElement("li");
        courseLi.innerText = courseInfo.courseName;
        courseLi.style.fontWeight = "bold";
        coursesUl.appendChild(courseLi);

        var classesUl = document.createElement("ul");
        courseLi.appendChild(classesUl);
        for (var j = 0; j < courseInfo.classes.length; j++) {
            var classInfo = courseInfo.classes[j];
            var span = document.createElement("span");
            span.innerText = "include " + courseInfo.classes.length + " classes";
            span.style.fontWeight = "normal";
            if (!classInfo.daysTimes || !classInfo.startEndDate) {
                span.innerText += ", some time info missing";
                span.style.color = "red";
            }
        }

        classesUl.appendChild(span);
    }

    classesInfo = convertCourses2Classes(coursesInfo);
    console.log(classesInfo);

    gtag('event', 'button_click', {
        'app_name': 'iCalendar_Converter',
        'button_name': 'Extract'
    });
}

function downloadCourses() {
    if (coursesInfo.length == 0) {
        alert("Please extract courses first.");
        return;
    }

    icsContent = classJSON2ICS(classesInfo, "HKUST Timetable");
    // console.log(icsContent);

    downloadICSFile(icsContent, "HKUST_Timetable.ics");

    gtag('event', 'button_click', {
        'app_name': 'iCalendar_Converter',
        'button_name': 'Download'
    });

}

function downloadICSFile(icsContent, filename) {
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.ics') ? filename : filename + '.ics';
    a.click();
    window.URL.revokeObjectURL(url);
}


function convertCourses2Classes(coursesInfo) {
    var classesInfo_withCourse = [];
    for (var i = 0; i < coursesInfo.length; i++) {
        var courseInfo = coursesInfo[i];
        var fistClassInfo = courseInfo.classes[0];

        for (var j = 0; j < courseInfo.classes.length; j++) {

            var classInfo = courseInfo.classes[j];

            // If the class info is empty, use the first class info(a system feature)
            if (!classInfo.classNbr) classInfo.classNbr = fistClassInfo.classNbr;
            if (!classInfo.section) classInfo.section = fistClassInfo.section;
            if (!classInfo.components) classInfo.components = fistClassInfo.components;

            // Add Course Info
            classInfo.courseName = courseInfo.courseName;
            classInfo.status = courseInfo.status;
            classInfo.units = courseInfo.units;
            classInfo.grading = courseInfo.grading;
            classInfo.grade = courseInfo.grade;

            // More Details
            var moreDetails = getClassDetails(classInfo);
            classInfo = Object.assign(classInfo, moreDetails);


            classesInfo_withCourse.push(classInfo);
        }
    }
    return classesInfo_withCourse;
}

function getClassDetails(classInfo) {


    const daysMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    var moreDetails = {
        daysStr: [],
        daysNum: [],
        startTimeStr: null,
        endTimeStr: null,
        instructors: [],
        startDate: null,
        endDate: null,
        firstDate: null,
        weekNum: 0
    }

    // Days & Times (We 16:30 - 18:20 or TuTh 16:30 - 17:50)
    if (classInfo.daysTimes) {
        const parts = classInfo.daysTimes.split(' ');
        if (parts.length == 4) {
            for (var i = 0; i < parts[0].length; i += 2) {
                var day = parts[0].substr(i, 2).toUpperCase();
                moreDetails.daysStr.push(day);
                moreDetails.daysNum.push(daysMap.indexOf(day));
            }
            moreDetails.startTimeStr = parts[1];
            moreDetails.endTimeStr = parts[3];
        }
    }

    // Instructors
    if (classInfo.instructor) {
        //different platforms use different separators
        moreDetails.instructors = classInfo.instructor.split(";");
    }

    // Start & End Date
    if (classInfo.startEndDate) {
        const parts = classInfo.startEndDate.split(' - ');
        if (parts.length == 2) {
            moreDetails.startDate = new Date(parts[0].split('/').reverse().join('-'));
            moreDetails.endDate = new Date(parts[1].split('/').reverse().join('-'));
        }
    }

    // First Date
    if (moreDetails.startDate && moreDetails.daysNum.length > 0) {
        const firstDate = new Date(moreDetails.startDate);
        while (!moreDetails.daysNum.includes(firstDate.getDay())) {
            firstDate.setDate(firstDate.getDate() + 1);
        }
        moreDetails.firstDate = firstDate;
    }

    // Week Num
    if (moreDetails.startDate && moreDetails.endDate) {
        const diffTime = Math.abs(moreDetails.endDate - moreDetails.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        moreDetails.weekNum = Math.ceil(diffDays / 7);
    }

    return moreDetails;
}


//=======================================================


class Event {
    constructor() {
        this.title = '';
        this.startTime = '';
        this.endTime = '';
        this.description = '';
        this.location = '';
        this.repeat = false;
        this.repeatRule = '';
        this.uid = '';
    }
    getStr() {
        const kwargs = {
            'SUMMARY': this.title,
            'DTSTART': this.startTime,
            'DTEND': this.endTime,
            'DESCRIPTION': this.description,
            'LOCATION': this.location,
            'UID': this.uid,
            'DTSTAMP': this.startTime,
        };
        if (this.repeat) {
            kwargs.RRULE = this.repeatRule;
        }
        let str = 'BEGIN:VEVENT\r\n';
        for (const [name, key] of Object.entries(kwargs)) {
            if (['DTSTART', 'DTEND', 'DTSTAMP'].includes(name)) {
                str += `${name};${key}\r\n`;
            } else {
                str += `${name}:${key}\r\n`;
            }
        }
        str += 'END:VEVENT\r\n';
        return str;
    }
}
class Calendar {
    constructor(calendarName) {
        this.textName = calendarName;
        this.eventList = [];
    }
    makeICSText() {
        let ICSText = 'BEGIN:VCALENDAR\r\n';
        ICSText += `PRODID:-//hkust.fun//iCalendar//${this.textName}\r\n`;
        ICSText += 'VERSION:2.0\r\n';
        ICSText += 'DESCRIPTION:Converter v1.0 (Lite)\r\n';
        ICSText += `X-WR-CALNAME:${this.textName}\r\n`;
        ICSText += 'BEGIN:VTIMEZONE\r\n';
        ICSText += 'TZID:Asia/Shanghai\r\n';
        ICSText += 'BEGIN:STANDARD\r\n';
        ICSText += 'TZOFFSETFROM:+0800\r\n';
        ICSText += 'TZOFFSETTO:+0800\r\n';
        ICSText += 'END:STANDARD\r\n';
        ICSText += 'END:VTIMEZONE\r\n';
        for (const aEvent of this.eventList) {
            ICSText += aEvent.getStr();
        }
        ICSText += 'END:VCALENDAR';
        return ICSText;
    }
}





function classJSON2ICS(classInfo, calendarName) {
    const aCalendar = new Calendar(calendarName);

    for (const [x, aClass] of Object.entries(classInfo)) {

        if (aClass.daysNum.length == 0) {
            continue;
        }

        let newClassName = aClass.courseName;
        if (aClass.section) {
            newClassName += `(${aClass.section})`;
        }

        var tmp = new Event();

        tmp.title = newClassName;
        tmp.description = `Instructor: ${aClass.instructor}`;
        //tmp.description = `Instructor: ${aClass.instructors.join(' ')}`;
        tmp.location = aClass.room;
        tmp.uid = `${x}-${aClass.classNbr}`;

        if (aClass.weekNum > 1) {
            tmp.repeat = true;
            tmp.repeatRule = `FREQ=WEEKLY;UNTIL=${formatDate(aClass.endDate)}T235959Z;BYDAY=${aClass.daysStr.join(',')}`;
        }

        tmp.startTime = `TZID=Asia/Shanghai:${formatDate(aClass.firstDate)}T${formatTime(aClass.startTimeStr)}`;
        tmp.endTime = `TZID=Asia/Shanghai:${formatDate(aClass.firstDate)}T${formatTime(aClass.endTimeStr)}`;

        aCalendar.eventList.push(tmp);
    }

    return aCalendar.makeICSText();
}


//====================【Utils】====================

function isDate(obj) {
    return obj instanceof Date && !isNaN(obj);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatTime(date) {

    //console.log("date: ", date, "typeof date: ", typeof date);

    if (typeof date === 'string') {
        date = date.trim();
        if (date === 'N/A') {
            return '000000';
        } else if (date.length === 4) {        // 0830
            return date + '00';
        } else if (date.length === 5) {         // 08:30
            return date.replace(':', '') + '00';
        } else if (date.includes('PM') || date.includes('AM')) {  // 4:30PM or 4:30AM
            const isPM = date.includes('PM');
            const timeStr = date.replace(/[AP]M/g, '').trim();
            const [hours, minutes] = timeStr.split(':');
            let hour24 = parseInt(hours);
            
            if (isPM && hour24 !== 12) {
            hour24 += 12;
            } else if (!isPM && hour24 === 12) {
            hour24 = 0;
            }
            
            const formattedHour = String(hour24).padStart(2, '0');
            const formattedMinute = (minutes || '00').padStart(2, '0');
            return formattedHour + formattedMinute + '00';
        }
    }
    else if (isDate(date)) {
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        return `${hour}${minute}${second}`;
    } else {
        return '000000';
    }
} 

function isWeChat() {
    var ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('micromessenger') != -1;
}


if (isWeChat()) {
    document.getElementById("wechatTip").style.display = "block";
}
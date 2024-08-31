export function extractCoursesJson() {
    //console.log("Extracting courses...");

    // Course List
    var courseNum = 0;
    var coursesInfo = [];
    while (true) {
        var course = getCoursesDiv_byCourseNum(courseNum);
        if (course == null) {
            break;
        }

        // Course Info
        var courseName = course.querySelector("td.PAGROUPDIVIDER").innerText.trim();
        var status = document.getElementById("STATUS$" + courseNum).innerText.trim();
        var units = document.getElementById("DERIVED_REGFRM1_UNT_TAKEN$" + courseNum).innerText.trim();
        var grading = document.getElementById("GB_DESCR$" + courseNum).innerText.trim();
        var grade = document.getElementById("DERIVED_REGFRM1_CRSE_GRADE_OFF$" + courseNum).innerText.trim();

        // Class List
        var classNum = 0;
        var classesInfo = [];
        while (true) {

            var classTr = getClassTr_byCourseNum_andRow(courseNum, classNum + 1);//！
            if (classTr == null) {
                break;
            }

            // Class Info
            var classNbr = classTr.querySelector("span[id^='DERIVED_CLS_DTL_CLASS_NBR$']")?.innerText.trim();
            var section = classTr.querySelector("span[id^='MTG_SECTION$']")?.innerText.trim();
            var components = classTr.querySelector("span[id^='MTG_COMP$']")?.innerText.trim();
            var daysTimes = classTr.querySelector("span[id^='MTG_SCHED$']")?.innerText.trim();
            var room = classTr.querySelector("span[id^='MTG_LOC$']")?.innerText.trim();
            var instructor = classTr.querySelector("span[id^='DERIVED_CLS_DTL_SSR_INSTR_LONG$']")?.innerText.replace(/\s*/g, ""); //!
            // var instructor_tmp = classTr.querySelector("span[id^='DERIVED_CLS_DTL_SSR_INSTR_LONG$']")?.innerHTML; //!
            // var instructor = instructor_tmp?.replace(/,<br>/g, ";").replace(/<span.*?>/g, "").replace(/<\/span>/g, "").trim(); //!
            var startEndDate = classTr.querySelector("span[id^='MTG_DATES$']")?.innerText.trim();

            var classInfo = {
                classNbr: classNbr,
                section: section,
                components: components,
                daysTimes: daysTimes,
                room: room,
                instructor: instructor,
                startEndDate: startEndDate
            };

            classesInfo.push(classInfo);
            classNum++;
        }

        var courseInfo = {
            courseName: courseName,
            status: status,
            units: units,
            grading: grading,
            grade: grade,

            classes: classesInfo
        };

        coursesInfo.push(courseInfo);
        courseNum++;
    }

    return coursesInfo;
}

// Get course <Div> under <Table>
// ID "win0divDERIVED_REGFRM1_DESCR20$0"
function getCoursesDiv_byCourseNum(courseIndex) {
    return document.getElementById("win0divDERIVED_REGFRM1_DESCR20$" + courseIndex);
}


// Get class <Tr> under classes <Table>
// ID "trCLASS_MTG_VW$0_row1" (start from 1)
function getClassTr_byCourseNum_andRow(courseIndex, classIndex) {
    //console.log("trCLASS_MTG_VW$" + courseIndex + "_row" + classIndex);
    return document.getElementById("trCLASS_MTG_VW$" + courseIndex + "_row" + classIndex);
}
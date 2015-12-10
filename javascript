
//retreoSearch: Test the different values
var TimeForLPO = 11 //18				//Time for LightPath optimisation GMT choose during the night (less offset)
var CheckStepsRetro = 10				//defines the range of the gradient checkcc
var StepSizeAlg1Retro = 20			//defines the length of the first jump in direction of the gradient
var StepSizeAlg2Retro = 5
var accuracy = 0.001				//percentage at which a the change in value is small enough to have reached the maximum
var OffsetIntensity = 1350
var MaxRetroSearchSteps = 20	//max search steps for Fixedpath Garadient function
var SearchStepsWhenNoRetro = 2  // extension of the search cross when Intenisty has the same magnitude than offset intensity
var StepSizeFindMinIntensity = 20
var NumberScansLPO = 1
var ExpTimeLPO = 1000


//------------------------------------------------------------------------------------------
//(9)								Retros Search
//------------------------------------------------------------------------------------------


//Scans the Intensity after moving to position a=horizontal,b=vertical

function ScanIntensity(a,b){
	MovePos(a,b)
	DoDummyReadout()
	dispSpectrograph.Scan(optScan,NumberScansLPO,ExpTimeLPO)
	var IntensityData = optScan.Intensity
	var Intensity = 0
	var count = 0

	for(var i = 670; i <= 970; i++){
		count = count + 1
		Intensity = Intensity + IntensityData[i]
	}
	return(Intensity/count)
} 

 
function float2int(value) {
    return value | 0;
}
 
//A cross with a pre defined length is beeing extendet over n until Retros found
function FindMinIntensity(x,y,StepSize,Value){
	var n
	var Position = [x,y]
	for(n=1;n<=SearchStepsWhenNoRetro; n++){
		Write("SearchStepsWhenNoRetro steps at " + n,true)
		var Value = ScanIntensity(x+StepSize*n,y)
		if (Value >= OffsetIntensity){
			Write("Found intensity higher than offset, start SearchAlgorythm Nr.1",true)
			Position = [x+StepSize*n,y]
			break}
		var Value = ScanIntensity(x,y-StepSize*n)
		if (Value >= OffsetIntensity){
			Write("Found intensity higher than offset, start SearchAlgorythm Nr.1",true)
			Position = [x,y-StepSize*n]
			break}
		var Value = ScanIntensity(x-StepSize*n,y)
		if (Value >= OffsetIntensity){
			Write("Found intensity higher than offset, start SearchAlgorythm Nr.1",true)
			Position = [x-StepSize*n,y]
			break}
		var Value = ScanIntensity(x,y+StepSize*n)
		if (Value >= OffsetIntensity){
			Position = [x,y+StepSize*n]
			Write("Found intensity higher than offset, start SearchAlgorythm Nr.1",true)
			break}
	}
return [Position, Value]
}


//Gradient funktion with a fixed path untill the value gets smaller

function CalcGrad(x,y,StepSize,Value){
	Console.WriteLine("StepSize: " +StepSize + "CheckSteps: " + CheckSteps)
	var PosV = ScanIntensity(x,y+CheckSteps)
	var PosH = ScanIntensity(x+CheckSteps,y)
	
	var ValueVer = PosV - Value
	var ValueHor = PosH - Value
	var Devider = Math.pow(ValueHor,2)+Math.pow(ValueVer,2)

	if (Devider == 0){
		Devider = 1
		Write("Devision by Zero, Devider set to " + Devider,true)
	}
	
	//Calculate the Gradient and move in the direktion of the maximum
	var New_X = x + float2int(Math.pow(ValueHor,2)/Devider)*StepSize;
	var New_Y = y + float2int((Math.pow(ValueVer,2)/Devider)*StepSize);

	var New_Value = ScanIntensity(New_X,New_Y)
	Write("Value is: " + New_Value + " at (" + New_X + " , " + New_Y + ")" ,true)
	return [New_X,New_Y,New_Value,Value]
}

function CalcGrad2(x,y,StepSize,Value){
	var PosV = ScanIntensity(x,y+CheckSteps)
	var PosH = ScanIntensity(x+CheckSteps,y)

	var ValueVer = PosV - Value
	var ValueHor = PosH - Value

	if (ValueVer >= ValueHor){
		var New_Value =  ScanIntensity(x,y+StepSize)
		var New_X = x
		var New_Y = y+StepSize
		}

	else{
		var New_Value =  ScanIntensity(x+StepSize,y)
		var New_X = x+StepSize
		var New_Y = y
		}
	Write("Value is: " + New_Value + " at (" + New_X + " , " + New_Y + ")" ,true)
	return [New_X,New_Y,New_Value,Value]
}



function RetroSearch(Retro){
	var LPOTime = RefreshTime()//Check time for LightPathoptimsation
	if (LPOTime[0] == TimeForLPO && DoLPOpt == true){
		//define variables in reletion to retro (smaller search steps for mirrir two)		

		var OldX = RetroPos[Retro][0]
		var OldY = RetroPos[Retro][1]

		
		Write("Time for light path optimasitaion",true)
		ShutterControl("LEDon")
		ShutterControl("SCopen")
		Write("Do Light path optimasitaion for " + Retros[Retro] + " at x = " + RetroPos[Retro][0] +" y = " + RetroPos[Retro][1],true)
		Write(" ",false)
		
		
		//(1)------------------------------ Cross check  -------------------
		Write("Do one corss check to see if light path optimasitaion is nessesary",true)
		var VerticalPlus = ScanIntensity(RetroPos[Retro][0],(RetroPos[Retro][1]+CheckSteps))
		var HorizontalPlus = ScanIntensity((RetroPos[Retro][0]+CheckSteps),RetroPos[Retro][1])
		var VerticalMinus = ScanIntensity(RetroPos[Retro][0],(RetroPos[Retro][1]-CheckSteps))
		var HorizontalMinus = ScanIntensity((RetroPos[Retro][0]+CheckSteps),RetroPos[Retro][1])
		var InitialIntensity = ScanIntensity(RetroPos[Retro][0],RetroPos[Retro][1])
		
		Write("                                 "+VerticalPlus+"                               ",false)
		Write("                                         :                                      ",false)
		Write("                                         :                                      ",false)
		Write("  "+HorizontalMinus+" - - - - - - "+InitialIntensity+" - - - - - - "+HorizontalPlus,false)
		Write("                                         :                                      ",false)
		Write("                                         :                                      ",false)
		Write("                                 "+VerticalMinus+"                              ",false)
		
		if(InitialIntensity >= VerticalPlus && InitialIntensity >= HorizontalPlus && InitialIntensity >= VerticalMinus && InitialIntensity >= HorizontalMinus){
			Write("Intesity at: " +InitialIntensity+" high enough for active measurment: No search routine necessary",true)
		}
		
		
		//------------------------------------- Search Algortithm  ------------------------------------	
		else{
			Write("Intesity is NOT high enough for active measurment: Search routine necessary",true)
			//(2)------------------------------ Grid Search  ------------------------------------------------
			if (InitialIntensity < OffsetIntensity){
				Write(" ",false)
				Write("Intensity extremely low --> No Retro!!!",true)
				Write("----------------Start GridSearch---------------",true)
				var MinIntData = FindMinIntensity(RetroPos[Retro][0],RetroPos[Retro][1],StepSizeFindMinIntensity,InitialIntensity)
				var Position = MinIntData[0]
				var Value = MinIntData[1]
			}
			else{
				var Position = [RetroPos[Retro][0],RetroPos[Retro][1]]
				var Value = InitialIntensity
				}
			
			
			//(3)------------------------------ Algorythm 1 first Step for Initial Values  ------------------
			Write(" ",false)
			Write("----------------Algorythm Step 1 for Initial Values---------------",true)
			Write(Position,true)
			Write("Calculate Gradient at (" + Position[0] + " , " + Position[1] + ")" ,true)
			var GradientInfo = CalcGrad(Position[0],Position[1],StepSizeAlg2, Value)
			//[New_X,New_Y,New_Value,Value]
			var New_Value = GradientInfo[2]
			
			
			//(4)------------------------------ go back to old position if Value > New_Value  ---------------
			
			if(New_Value <= Value){//in this case alg1 will be skipt
				Write("Gradient with fixed path exceedet its accuracy, move back to previous position and start Gradient 2",true)
				MovePos(OldX,OldY)
			}
			else{
			Write(" ",false)
			Write("----------------Algorythm 1 Big Steps---------------",true)
			}	
				
				
			//(4)------------------------------ Algorythm 1 big Steps  --------------------------------------
			var Steps = 1
			while(Steps <= MaxRetroSearchSteps && New_Value >= Value){
				OldX = GradientInfo[0]
				OldY = GradientInfo[1]
				Steps = Steps + 1
				Write("Searching for Retros....... Step " + Steps +" .........",true)
				var GradientInfo = CalcGrad(GradientInfo[0],GradientInfo[1],StepSizeAlg1,New_Value)
				var New_Value = GradientInfo[2]
			}
			
			
			//(5)------------------------------ go back to old position if Value > New_Value  ---------------
			if(Steps > 1){
				Write("Gradient with fixed path exceedet its accuracy, move back to previous position and start Gradient 2",true)
				MovePos(OldX,OldY)
				}
			

			//(6)------------------------------ Algorythm 2 first Step for Initial Values -------------------
			Write(" ",false)
			Write("----------------Algorithm 2 Small steps---------------",true)		
			Write("Calculate Gradient at (" + OldX + " , " + OldY + ")" ,true)
			var Value = ScanIntensity(OldX,OldY)
			var GradientInfo = CalcGrad2(OldX,OldY,StepSizeAlg2,Value)
			var New_Value = GradientInfo[2]
			
			
			//(7)------------------------------ go back to old position if Value > New_Value  ---------------
			if(Math.abs(1-(New_Value/Value)) <= accuracy){
				Write("Gradient2 with fixed direction exceedet its accuracy, move back to previous position",true)
				MovePos(OldX,OldY)
				Write("Retro found at (" + OldX + "," + OldY + ") with Intenstity: " + Value,true)
				RetroPos[Retro][0] = OldX
				RetroPos[Retro][1] = OldY
				}
			
			
			//(8)------------------------------ Algorythm 2 small Steps  --------------------------------------
			else{
				Write(" ",false)
				while(Steps <= MaxRetroSearchSteps && New_Value >= Value){
					OldX = GradientInfo[0]
					OldY = GradientInfo[1]
					Steps = Steps + 1
					Write("Searching for Retros............. Step " + Steps +" ...............",true)
					var GradientInfo = CalcGrad2(GradientInfo[0],GradientInfo[1],StepSizeAlg2,New_Value)
					var New_Value = GradientInfo[2]
				}		
				
				
				//(9)------------------------------ go back to old position if Value > New_Value  ---------------
				if(Math.abs(1-(New_Value/Value)) <= accuracy){
					Write("Gradient2 with fixed direction exceedet its accuracy, move back to previous position",true)
					MovePos(OldX,OldY)
					Write("Retro found at (" + OldX + "," + OldY + "with Intenstity: " + Value ,true)
					RetroPos[Retro][0] = OldX
					RetroPos[Retro][1] = OldY
				}
				else{Write("NO Retroe found, use old retro position",true)}
			}
		}
	}
}
